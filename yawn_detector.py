import cv2
import dlib
import numpy as np
from flask import Flask, request, jsonify

# yawn_detector.py

app = Flask(__name__)
detector = dlib.get_frontal_face_detector()
predictor = dlib.shape_predictor("shape_predictor_68_face_landmarks.dat")

def mouth_aspect_ratio(landmarks):
    top_lip = landmarks[62]
    bottom_lip = landmarks[66]
    mar = np.linalg.norm(top_lip - bottom_lip)
    return mar

@app.route('/detect', methods=['POST'])
def detect():
    file = request.files['image']
    npimg = np.frombuffer(file.read(), np.uint8)
    frame = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = detector(gray)

    for face in faces:
        shape = predictor(gray, face)
        landmarks = np.array([[p.x, p.y] for p in shape.parts()])
        mar = mouth_aspect_ratio(landmarks)
        if mar > 20:  # adjust this threshold
            return jsonify({"yawning": True})

    return jsonify({"yawning": False})

if __name__ == '__main__':
    app.run(debug=True)