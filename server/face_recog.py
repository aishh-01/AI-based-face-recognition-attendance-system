import sys
import cv2
import face_recognition
import numpy as np
import os
import time
from attendance_manager import mark_attendance, initialize_attendance_sheet
from pymongo import MongoClient
from bson.binary import Binary
import io
from PIL import Image
course = sys.argv[1] if len(sys.argv) > 1 else "UnknownCourse"
stream = sys.argv[2] if len(sys.argv) > 2 else "UnknownStream"
year = sys.argv[3] if len(sys.argv) > 3 else "UnknownYear"
semester = sys.argv[4] if len(sys.argv) > 4 else "UnknownSemester"
subject = sys.argv[5] if len(sys.argv) > 5 else "UnknownSubject"


def load_known_faces_from_db():
    client = MongoClient("mongodb://127.0.0.1:27017")
    db = client["attendanceDB"]
    students = db["students"].find()

    known_encodings = []
    known_ids = []

    for student in students:
        photo_path = student.get("photo")
        photo_path = photo_path.replace("\\", "/")  # Convert to correct path format

        student_id = student.get("studentID")  # Make sure this field exists in MongoDB

        if photo_path and os.path.exists(photo_path.replace("\\", "/")):
            img = face_recognition.load_image_file(photo_path.replace("\\", "/"))
            encodings = face_recognition.face_encodings(img)
            if encodings:
                known_encodings.append(encodings[0])
                known_ids.append(student_id)  # Use ID instead of name
                print(f"[DB LOAD] Loaded ID {student_id}")

    return known_encodings, known_ids

def recognize_faces(known_encodings, known_ids):
    """Capture video and recognize faces in real-time."""
    recognized_ids = set()

    # Open the webcam
    video_capture = cv2.VideoCapture(0)


    if not video_capture.isOpened():
        print("[ERROR] Camera not accessible! Check device permissions.")
        return recognized_ids

    print("[INFO] Press 'q' to exit.")

    while True:
        ret, frame = video_capture.read()
        if not ret:
            print("[ERROR] Failed to capture frame!")
            break

        # Convert frame to RGB (face_recognition uses RGB)
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # Detect faces
        face_locations = face_recognition.face_locations(rgb_frame)
        face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)

        for encoding, location in zip(face_encodings, face_locations):
            name = "UNKNOWN"
            color = (0, 0, 255)  # Red for unknown faces

            if known_encodings:
                distances = face_recognition.face_distance(known_encodings, encoding)
                min_distance_index = np.argmin(distances)

                if distances[min_distance_index] < 0.5:
                    student_id = known_ids[min_distance_index]
                    recognized_ids.add(student_id)
                    name = student_id  # Show student ID on screen
                    color = (0, 255, 0)
                    print(f"[SUCCESS] {name} recognized.")


            # Draw a rectangle and label
            top, right, bottom, left = location
            cv2.rectangle(frame, (left, top), (right, bottom), color, 2)
            cv2.putText(frame, name, (left, top - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

        # Show the frame with bounding boxes
        cv2.imshow("Face Recognition Attendance", frame)

        # Press 'q' to exit
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    # Release webcam and close windows
    video_capture.release()
    cv2.destroyAllWindows()

    return recognized_ids

def main():
    known_encodings, known_ids = load_known_faces_from_db()
    initialize_attendance_sheet(course, stream)
    recognized_ids = recognize_faces(known_encodings, known_ids)
    mark_attendance(course, year, subject, stream, list(recognized_ids))



if __name__ == "__main__":
    main()
