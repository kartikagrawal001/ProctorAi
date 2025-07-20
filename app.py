from flask import Flask, jsonify, request
from flask_cors import CORS
import cv2
import numpy as np
import mediapipe as mp
import torch

app=Flask(__name__)
CORS(app)


users=[{"username":"admin","rollNumber":"123","password":"admin"},{
    "username":"kartik bansal","rollNumber":"1234","password":"1234"
}]

alert_logs={}
registered_faces = set()  # Just store roll numbers that registered

# Load YOLOv5 model (do this once at startup)
model = torch.hub.load('ultralytics/yolov5', 'yolov5m', pretrained=True)

@app.route('/log-alert',methods=['POST'])
def log_alert():
    data=request.get_json()
    student_id=data.get('student_id')
    direction=data.get('direction')
    time=data.get('time')
    if student_id and direction and time:
        alert_logs.setdefault(student_id,[]).append({'direction':direction,'time':time})
        return jsonify({'status':'ok'})
    return jsonify({'status':'error','message':'Missing data'},),400

@app.route('/alerts', methods=['GET'])
def get_alerts():
    return jsonify(alert_logs)

@app.route('/login' ,methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"message": "No JSON data received"}), 400
    username=data.get('username')
    rollNumber=data.get('rollNumber')
    password=data.get('password')

    for user in users:
        if(user['username']==username and user['rollNumber']==rollNumber and user['password']==password):
            return jsonify({"message":"Login successful"})
    return jsonify({"message":"Invalid credentials"})

# Initialize MediaPipe Face Mesh
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1)
model_points = np.array([
    (0.0, 0.0, 0.0),          # Nose tip
    (0.0, -330.0, -65.0),     # Chin
    (-225.0, 170.0, -135.0),  # Left eye left corner
    (225.0, 170.0, -135.0),   # Right eye right corner
    (-150.0, -150.0, -125.0), # Left mouth corner
    (150.0, -150.0, -125.0)   # Right mouth corner
], dtype=np.float64)
landmark_ids = [1, 152, 263, 33, 287, 57]
YAW_THRESHOLD, PITCH_THRESHOLD, ROLL_THRESHOLD = 30, 20, 30

@app.route('/detect-head', methods=['POST'])
def detect_head():
    file = request.files['image']
    npimg = np.frombuffer(file.read(), np.uint8)
    frame = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
    h, w = frame.shape[:2]
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(rgb)
    direction, yaw, pitch, roll = "No face detected", 0, 0, 0

    if results.multi_face_landmarks:
        face_landmarks = results.multi_face_landmarks[0]
        image_points = []
        for idx in landmark_ids:
            pt = face_landmarks.landmark[idx]
            x, y = int(pt.x * w), int(pt.y * h)
            image_points.append((x, y))
        image_points = np.array(image_points, dtype=np.float64)
        focal_length = w
        center = (w / 2, h / 2)
        camera_matrix = np.array([
            [focal_length, 0, center[0]],
            [0, focal_length, center[1]],
            [0, 0, 1]
        ], dtype=np.float64)
        dist_coeffs = np.zeros((4, 1))
        success, rotation_vector, translation_vector = cv2.solvePnP(
            model_points, image_points, camera_matrix, dist_coeffs)
        rmat, _ = cv2.Rodrigues(rotation_vector)
        angles, _, _, _, _, _ = cv2.RQDecomp3x3(rmat)
        pitch, yaw, roll = angles
        direction = "Looking Forward"
        if yaw > YAW_THRESHOLD:
            direction = "ALERT: Looking Right"
        elif yaw < -YAW_THRESHOLD:
            direction = "ALERT: Looking Left"
        elif pitch > PITCH_THRESHOLD:
            direction = "ALERT: Looking Down"
        elif pitch < -PITCH_THRESHOLD:
            direction = "ALERT: Looking Up"
        elif abs(roll) > ROLL_THRESHOLD:
            direction = "ALERT: Tilting Head"

    return jsonify({'direction': direction, 'yaw': float(yaw), 'pitch': float(pitch), 'roll': float(roll)})

mp_face_detection = mp.solutions.face_detection
face_detection = mp_face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.5)

@app.route('/register-face', methods=['POST'])
def register_face():
    roll_number = request.form['roll_number']
    file = request.files['image']
    npimg = np.frombuffer(file.read(), np.uint8)
    frame = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
    if frame is None:
        return jsonify({'status': 'no_face'})
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    if rgb is None or rgb.size == 0:
        return jsonify({'status': 'no_face'})
    results = face_detection.process(rgb)
    if results.detections:
        if len(results.detections) == 1:
            registered_faces.add(roll_number)
            return jsonify({'status': 'registered'})
        else:
            return jsonify({'status': 'multiple_faces'})
    else:
        return jsonify({'status': 'no_face'})

@app.route('/verify-face', methods=['POST'])
def verify_face():
    roll_number = request.form['roll_number']
    file = request.files['image']
    npimg = np.frombuffer(file.read(), np.uint8)
    frame = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = face_detection.process(rgb)
    if not results.detections:
        return jsonify({'status': 'no_face'})
    elif len(results.detections) > 1:
        return jsonify({'status': 'multiple_faces'})
    else:
        # For true recognition, you need a face embedding model.
        # Here, we just check that a face is present and the student is registered.
        if roll_number in registered_faces:
            return jsonify({'status': 'match'})
        else:
            return jsonify({'status': 'mismatch'})

@app.route('/detect-object', methods=['POST'])
def detect_object():
    file = request.files['image']
    npimg = np.frombuffer(file.read(), np.uint8)
    frame = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = model(rgb)
    df = results.pandas().xyxy[0]
    df = df[df['confidence'] > 0.3]  # Try 0.3 for more sensitivity
    labels = df['name'].tolist()
    print("Detected labels (conf > 0.3):", labels)
    # Check for forbidden objects
    forbidden = {'cell phone', 'laptop', 'tv', 'remote', 'mouse', 'keyboard'}
    detected = [label for label in labels if label in forbidden]
    if detected:
        return jsonify({'status': 'forbidden_object', 'objects': detected})
    else:
        return jsonify({'status': 'clear'})


if __name__=="__main__":
    app.run(debug=True)
