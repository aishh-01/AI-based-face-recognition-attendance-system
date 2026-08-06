from flask import Flask, request, jsonify
import os
import subprocess
from flask_cors import CORS
from attendance_manager import initialize_attendance_sheet,get_attendance_file
import pandas as pd

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return "Flask Server is Running"

@app.route('/sync_excel', methods=['POST'])
def sync_excel():
    try:
        data = request.get_json()
        student_id = data['studentID']
        name = data['name']
        course = data['course']
        stream = data.get('stream', '')  # Optional

        file_path = get_attendance_file(course, stream)

        # New student entry
        new_row = {"StudentID": student_id, "Name": name}

        # Ensure directory exists
        os.makedirs(os.path.dirname(file_path), exist_ok=True)

        if os.path.exists(file_path):
            df = pd.read_excel(file_path, engine='openpyxl')
            # Enforce only required columns
            df = df[["StudentID", "Name"]]
        else:
            df = pd.DataFrame(columns=["StudentID", "Name"])

        # Check if student already exists
        if str(student_id) in df["StudentID"].astype(str).values:
            return jsonify({"status": "exists", "message": "Student already exists in Excel"}), 200

        # Append and save
        df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)

        with pd.ExcelWriter(file_path, engine='openpyxl', mode='w') as writer:
            df.to_excel(writer, index=False)

        return jsonify({"status": "success", "message": "Student added to Excel"})

    except Exception as e:
        print(f"[ERROR] sync_excel: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500



@app.route('/start_attendance', methods=['POST'])
def start_attendance():
    try:
        data = request.get_json()
        course = data.get('course')
        semester = data.get('semester')
        print(f"[DEBUG] Received Course: {course}, Semester: {semester}")

        if not course or not semester:
            return jsonify({"status": "error", "message": "Missing course or semester"}), 400

        file_name = f"{course}_{semester}.xlsx"
        file_path = os.path.join("attendances", file_name)
        if not os.path.exists(file_path):
            return jsonify({"status": "error", "message": f"File {file_name} not found!"}), 404

        # Initialize the attendance sheet
        initialize_attendance_sheet(course, semester)

        # Launch face recognition script in a separate process
        subprocess.Popen(["python", "server/face_recog.py", course, semester])

        return jsonify({"status": "success", "message": "Attendance started!"})
    

    except Exception as e:
        print("[ERROR] Exception:", e)
        return jsonify({"status": "error", "message": str(e)}), 500
    

@app.route('/stop_attendance', methods=['POST'])
def stop_attendance():
    global attendance_process
    if attendance_process:
        os.system("taskkill /F /IM python.exe")  # Force kill the process
        attendance_process = None
        return jsonify({"status": "success", "message": "Attendance stopped successfully!"})
    return jsonify({"status": "error", "message": "No active process found!"})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
