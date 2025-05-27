import cv2

cap = cv2.VideoCapture(1, cv2.CAP_DSHOW)  # Use correct camera index

if not cap.isOpened():
    print("❌ ERROR: Could not access webcam")
else:
    print("✅ Webcam is working!")

while True:
    ret, frame = cap.read()
    
    if not ret:
        print("❌ ERROR: Could not read frame")  # Debugging log
        break

    # Show webcam feed
    cv2.imshow("Webcam Feed", frame)

    # Press 'q' to exit
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
