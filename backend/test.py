import requests

# Your API key here
API_KEY = "sk_7f2b8af0cd8c1a7402b00a8f8d9819f976179127b910af87"

# Your desired voice ID (you can get it from ElevenLabs dashboard)
voice_id = "c470sxKWDq6tA74TL3yB"  # Example: "Sikedewi"

# Text you want to convert to speech
text = "halo, apa kabar? saya ingin tahu tentang anda."
# ElevenLabs TTS endpoint
url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"

headers = {
    "accept": "audio/mpeg",
    "xi-api-key": API_KEY,
    "Content-Type": "application/json"
}

data = {
    "text": text,
    "model_id": "eleven_multilingual_v2",
    "voice_settings": {
        "speed": 1,
        "stability": 0.83,
        "similarity_boost": 0.82,
        "style_exaggeration": 0,
    }
}

# Send request
response = requests.post(url, headers=headers, json=data)

# Save response as MP3
if response.status_code == 200:
    with open("output_id.mp3", "wb") as f:
        f.write(response.content)
    print("Speech saved as output_id.mp3")
else:
    print(f"Error: {response.status_code} - {response.text}")
