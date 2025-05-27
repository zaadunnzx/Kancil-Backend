from flask import Flask, jsonify, Response, send_file, request
from flask_cors import CORS
import os
import cv2
import mediapipe as mp
import numpy as np
import time
from math import hypot
import requests

camera_index = 0  # Default to 0
cap = cv2.VideoCapture(camera_index)

from openai import OpenAI
client = OpenAI(
    # This is the default and can be omitted
    api_key="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",
)

ELEVEN_API_KEY = "sk_7f2b8af0cd8c1a7402b00a8f8d9819f976179127b910af87"

# Text to speech 
model_used = "yLyL4E4r0QfLyYpCwPir"

# sikedewi_id = "yLyL4E4r0QfLyYpCwPir"
# kennisa_id = "c470sxKWDq6tA74TL3yB"


eleven_headers = {
    "accept": "audio/mpeg",
    "xi-api-key": ELEVEN_API_KEY,
    "Content-Type": "application/json"
}



app = Flask(__name__)
CORS(app)

# Setup for Mediapipe and OpenCV
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=False, refine_landmarks=True)

cap = cv2.VideoCapture(camera_index)

model_points = np.array([
    (0.0, 0.0, 0.0),
    (0.0, -330.0, -65.0),
    (-225.0, 170.0, -135.0),
    (225.0, 170.0, -135.0),
    (-150.0, -150.0, -125.0),
    (150.0, -150.0, -125.0)
])

landmark_ids = [1, 152, 263, 33, 287, 57]

# For timing
start_distracted = None
alert_triggered = False

yawn_start_time = None
yawn_alert_triggered = False

comm_status = 1
notification_status = 0
notification_message = ""

def set_notification(status, message):
    global notification_status, notification_message
    notification_status = status
    notification_message = message

@app.route('/api/set_camera', methods=['POST'])
def set_camera():
    global cap, camera_index
    data = request.get_json()
    new_index = int(data.get('index', 0))
    if new_index != camera_index:
        camera_index = new_index
        # Release old capture and open new one
        cap.release()
        cap = cv2.VideoCapture(camera_index)
    return jsonify({'status': 'ok', 'camera_index': camera_index})

# Video frame generator for Flask
def generate_frames():
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        h, w, _ = frame.shape
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(frame_rgb)

        if results.multi_face_landmarks:
            face_landmarks = results.multi_face_landmarks[0]

            # Head Pose Estimation
            image_points = []
            for idx in landmark_ids:
                lm = face_landmarks.landmark[idx]
                x, y = int(lm.x * w), int(lm.y * h)
                image_points.append((x, y))

            image_points = np.array(image_points, dtype="double")
            focal_length = w
            center = (w / 2, h / 2)
            camera_matrix = np.array(
                [[focal_length, 0, center[0]],
                 [0, focal_length, center[1]],
                 [0, 0, 1]], dtype="double"
            )
            dist_coeffs = np.zeros((4, 1))

            success, rotation_vector, translation_vector = cv2.solvePnP(
                model_points, image_points, camera_matrix, dist_coeffs
            )

            if success:
                rvec_matrix, _ = cv2.Rodrigues(rotation_vector)
                proj_matrix = np.hstack((rvec_matrix, translation_vector))
                _, _, _, _, _, _, eulerAngles = cv2.decomposeProjectionMatrix(proj_matrix)

                yaw = eulerAngles[1, 0]
                is_distracted = abs(yaw) > 60

                if is_distracted:
                    if start_distracted is None:
                        start_distracted = time.time()
                    elif time.time() - start_distracted > 3 and not alert_triggered:
                        alert_triggered = True
                else:
                    start_distracted = None
                    alert_triggered = False

                direction = "Focused" if not is_distracted else "Not Focused"
                cv2.putText(frame, f"Yaw: {int(yaw)} | Status: {direction}",
                            (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.8,
                            (0, 0, 255) if is_distracted else (0, 255, 0), 2)

            # Yawning Detection
            lm13 = face_landmarks.landmark[13]  # Upper lip
            lm14 = face_landmarks.landmark[14]  # Lower lip
            x13, y13 = int(lm13.x * w), int(lm13.y * h)
            x14, y14 = int(lm14.x * w), int(lm14.y * h)

            mouth_opening = hypot(x14 - x13, y14 - y13)

            if mouth_opening > 25:
                if yawn_start_time is None:
                    yawn_start_time = time.time()
                elif time.time() - yawn_start_time > 1.5 and not yawn_alert_triggered:
                    yawn_alert_triggered = True
            else:
                yawn_start_time = None
                yawn_alert_triggered = False
            # Draw yawning text if triggered
            if yawn_alert_triggered:
                set_notification(1, "Ngantuk bro? Cuci muka dulu")
                cv2.putText(frame, "Ngantuk bro? Cuci muka dulu", (20, 70),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)

        # Encode frame to send over HTTP
        ret, buffer = cv2.imencode('.jpg', frame)
        if not ret:
            continue
        frame = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n\r\n')

# Route for streaming video to the frontend
@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route("/audio")
def stream_audio():
    def generate():
        with open("output_id.mp3", "rb") as f:
            chunk = f.read(1024)
            while chunk:
                yield chunk
                chunk = f.read(1024)
    return Response(generate(), mimetype="audio/mpeg")

@app.route("/audio_notification")
def stream_notification_audio():
    def generate():
        with open("notification.mp3", "rb") as f:
            chunk = f.read(1024)
            while chunk:
                yield chunk
                chunk = f.read(1024)
    return Response(generate(), mimetype="audio/mpeg")

def replace_fraction_slash(text):
    # Replace e.g. 2/3 or 10/11 with "2 per 3" or "10 per 11"
    import re
    return re.sub(r'(\d+)\s*/\s*(\d+)', r'\1 per \2', text)

def generate_audio(text, output_path="output_id.mp3", voice_id=model_used):
    print(f"TEXT CHATGPT: {text}")

    # Replace fraction slashes before sending to elevenlabs
    processed_text = replace_fraction_slash(text)
    
    print(f"TEXT PROCESSED: {processed_text}")

    eleven_url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"

    data = {
        "text": processed_text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "speed": 1,
            "stability": 0.83,
            "similarity_boost": 0.82,
            "style_exaggeration": 0,
        }
    }

    # Send request
    response = requests.post(eleven_url, headers=eleven_headers, json=data)

    # Save response as MP3
    if response.status_code == 200:
        with open(output_path, "wb") as f:
            f.write(response.content)
        print("Speech saved as output_id.mp3")
    else:
        print(f"Error: {response.status_code} - {response.text}")

@app.route('/api/sendtext', methods=['POST'])
def send_text():
    global comm_status
    comm_status = 0

    # Get JSON data from the request
    data = request.get_json()

    # Do something with the data
    text = data.get('prompt')
    
    try:
        response = client.responses.create(
            model="gpt-4o-mini",
            instructions="Kamu adalah tutor belajar. Gunakan bahasa Indonesia. Gunakan bahasa lisan. Maksimal 20 kata. Apabila terdapat eqation matematika, olahlah menggunakan LaTex, contoh string full seperti ini : 'Hello, so the way to do this is\n[math]\\frac{2}{3} + \\frac{4}{121} = \\frac{254}{363}[/math]\nThat is the way!' ",
            # NAIKIN WHEN PRESENTASI
            input=text,
        )
        
        generate_audio(response.output_text)
        comm_status = 1

        return jsonify({'generated_text': response.output_text})
    except Exception as e:
        comm_status = 1
        return jsonify({'error': str(e)}), 500

@app.route('/api/status', methods=['GET'])
def get_status():
    return jsonify({'status': comm_status})

@app.route('/api/notification', methods=['GET'])
def get_notification():
    temp = notification_status
    set_notification(0, notification_message)

    return jsonify({
        'type': 'info',  # could be 'success', 'error', etc.
        'status' : temp,
        'message': notification_message
    })

@app.route('/api/send_notification', methods=['POST'])
def generate_notification():
    global comm_status
    comm_status = 0

    try:
        generate_audio(notification_message, "notification.mp3", voice_id=kennisa_id)
        comm_status = 2

        return jsonify({'status': 200})
    except Exception as e:
        comm_status = 2
        return jsonify({'error': str(e)}), 500

@app.route('/api/transcribe', methods=['POST'])
def transcribe_audio():
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        
        audio_file = request.files['audio']
        
        # Save temporarily
        temp_path = "temp_audio.wav"
        audio_file.save(temp_path)
        
        # Transcribe using OpenAI Whisper
        with open(temp_path, "rb") as audio:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio,
                language="id"  # Indonesian language
            )
        
        # Clean up temp file
        os.remove(temp_path)
        
        return jsonify({
            'success': True,
            'transcript': transcript.text
        })
        
    except Exception as e:
        print(f"Transcription error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Start the Flask app
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
