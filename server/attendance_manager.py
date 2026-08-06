import pandas as pd
import os
from datetime import date
from openpyxl import load_workbook

ATTENDANCE_DIR = "excels"

def get_attendance_file(course, stream):
    filename = f"{course}_{stream}.xlsx" if stream and stream != "Not Needed" else f"{course}.xlsx"
    return os.path.join(ATTENDANCE_DIR, filename)

def initialize_attendance_sheet(course, stream):
    file_path = get_attendance_file(course, stream)
    if not os.path.exists(file_path):
        print(f"[ERROR] Attendance file '{file_path}' not found!")
        return

    try:
        df = pd.read_excel(file_path, engine='openpyxl')
        today = date.today().strftime("%d-%m-%Y")

        if today not in df.columns:
            df[today] = "Absent"
            print(f"[INFO] Added column for today: {today}")

            # Overwrite the sheet fully to preserve column structure
            with pd.ExcelWriter(file_path, engine='openpyxl', mode='w') as writer:
                df.to_excel(writer, index=False)

    except Exception as e:
        print(f"[ERROR] While initializing attendance sheet: {e}")


def mark_attendance(course, year, subject, stream, recognized_ids):
    file_path = get_attendance_file(course, stream)
    if not os.path.exists(file_path):
        print(f"[ERROR] Attendance file '{file_path}' not found!")
        return

    try:
        df = pd.read_excel(file_path, engine='openpyxl')
        today = date.today().strftime("%d-%m-%Y")

        if today not in df.columns:
            df[today] = "Absent"

        for sid in recognized_ids:
            df.loc[df['StudentID'].astype(str) == str(sid), today] = "Present"

        # Overwrite the sheet to cleanly update
        with pd.ExcelWriter(file_path, engine='openpyxl', mode='w') as writer:
            df.to_excel(writer, index=False)

        print(f"[INFO] Attendance marked for {len(recognized_ids)} student(s).")

    except Exception as e:
        print(f"[ERROR] While marking attendance: {e}")
