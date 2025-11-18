from flask import Flask, request, jsonify, send_file, make_response
from flask_cors import CORS
import sqlite3
import logging
import os
import google.generativeai as genai
from dotenv import load_dotenv
import json
import csv
from io import StringIO
import requests

load_dotenv()

logging.basicConfig(level=logging.INFO)
app = Flask(__name__)
# NEW - Correct path matching
CORS(app, resources={r"/api/.*": {"origins": "*"}}, supports_credentials=True)

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY not found. Make sure it's set in your .env file.")
genai.configure(api_key=api_key)

# Database setup
DB_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "students.db"))

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("""CREATE TABLE IF NOT EXISTS students (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    fullName TEXT NOT NULL,
                    studentID TEXT NOT NULL UNIQUE,
                    college TEXT NOT NULL,
                    course TEXT NOT NULL,
                    address TEXT NOT NULL,
                    mobile TEXT NOT NULL,
                    email TEXT NOT NULL UNIQUE,
                    year TEXT NOT NULL,
                    cgpa TEXT NOT NULL,
                    opportunity TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )""")
    
    c.execute("""
        CREATE TABLE IF NOT EXISTS actions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            studentID TEXT NOT NULL,
            action_type TEXT NOT NULL,
            points INTEGER NOT NULL,
            meta TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(studentID) REFERENCES students(studentID)
        )
    """)
    conn.commit()
    conn.close()
    logging.info("Database initialized: %s", DB_FILE)

init_db()

def query_db(query, args=(), one=False):
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute(query, args)
    rv = cur.fetchall()
    conn.close()
    return (rv[0] if rv else None) if one else rv

# Action-to-points mapping for scoring
ACTION_POINTS = {
    "submit_application": -10,
    "clicked_apply": -5,
    "opened_phishing_link": -50,
    "submitted_sensitive_info": -100,
    "viewed_opportunity": 0,
    "reported_phish": 80,
    "used_report_button": 30,
    "ignored_email": 20,
    "closed_page_quickly": 10,
}

@app.route("/api/students-data", methods=["POST"])
def add_student():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON"}), 400
        
    default_data = {
        "fullName": "",
        "studentID": "",
        "college": "",
        "course": "",
        "address": "",
        "mobile": "",
        "email": "",
        "year": "",
        "cgpa": "",
        "opportunity": ""
    }
    
    for key in default_data:
        if key in data and data[key] is not None:
            default_data[key] = str(data[key]).strip()
    
    data = default_data

    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute("""INSERT INTO students 
                         (fullName, studentID, college, course, address, mobile, email, year, cgpa, opportunity)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                  (data["fullName"], data["studentID"] or f'anonymous_{c.lastrowid}', 
                   data["college"], data["course"], data["address"], 
                   data["mobile"], data["email"] or f'noreply_{c.lastrowid}@example.com', 
                   data["year"], data["cgpa"], data["opportunity"]))
        conn.commit()
        last_id = c.lastrowid

        try:
            student_id = data["studentID"] or f'anonymous_{last_id}'
            action_points = ACTION_POINTS.get("submit_application", 0)
            c.execute(
                "INSERT INTO actions (studentID, action_type, points, meta) VALUES (?, ?, ?, ?)",
                (student_id, "submit_application", action_points, json.dumps({
                    "source": "auto_on_submit",
                    "empty_fields": sum(1 for v in data.values() if not v),
                    "total_fields": len(data)
                }))
            )
            conn.commit()
        except Exception as e:
            logging.warning("Failed to record submit_application action: %s", e)
            
        conn.close()
        logging.info("Inserted student id=%s name=%s", last_id, data["fullName"])

        try:
            webhook_url = os.getenv("N8N_WEBHOOK_URL")
            if webhook_url:
                payload = {
                    "fullName": data["fullName"],
                    "email": data["email"]
                }
                requests.post(webhook_url, json=payload, timeout=2)
                logging.info("Triggered n8n webhook for student: %s", data["email"])
        except Exception as e:
            logging.warning("Could not trigger n8n webhook: %s", e)

        return jsonify({"success": True, "id": last_id}), 201
    
    except sqlite3.IntegrityError as e:
        logging.warning(f"DB insert failed due to duplicate entry: {e}")
        return jsonify({"error": "This email or student ID already exists."}), 409
    except Exception as e:
        logging.exception("DB insert failed")
        return jsonify({"error": "An unexpected server error occurred."}), 500

@app.route("/api/students-data", methods=["GET"])
def get_students():
    try:
        rows = query_db("SELECT * FROM students ORDER BY created_at DESC")
        students = [dict(row) for row in rows] 
        return jsonify(students), 200
    except Exception as e:
        logging.exception("Failed to fetch students")
        return jsonify({"error": "Server error"}), 500

@app.route("/api/record-action", methods=["POST"])
def record_action():
    try:
        payload = request.get_json(force=True)
        studentID = (payload.get("studentID") or "").strip()
        action_type = (payload.get("action") or "").strip()
        meta = payload.get("meta")

        if not studentID or not action_type:
            return jsonify({"error": "studentID and action are required"}), 400

        exists = query_db("SELECT 1 FROM students WHERE studentID = ?", (studentID,), one=True)
        if not exists:
            return jsonify({"error": "student not found"}), 404

        points = int(ACTION_POINTS.get(action_type, 0))

        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute(
            "INSERT INTO actions (studentID, action_type, points, meta) VALUES (?, ?, ?, ?)",
            (studentID, action_type, points, json.dumps(meta) if meta is not None else None)
        )
        conn.commit()
        conn.close()
        return jsonify({"success": True, "points": points}), 201
    except Exception as e:
        logging.exception("Failed to record action")
        return jsonify({"error": "server error"}), 500

@app.route("/api/scores", methods=["GET"])
def get_scores():
    try:
        rows = query_db(
            """
            SELECT s.id, s.fullName, s.studentID, s.email,
                   COALESCE(SUM(a.points), 0) AS score,
                   COUNT(a.id) AS actions_count
            FROM students s
            LEFT JOIN actions a ON a.studentID = s.studentID
            GROUP BY s.id, s.fullName, s.studentID, s.email
            ORDER BY score DESC, actions_count DESC, s.created_at ASC
            """
        )
        return jsonify([dict(r) for r in rows]), 200
    except Exception as e:
        logging.exception("Failed to get scores")
        return jsonify({"error": "server error"}), 500

@app.route("/api/leaderboard", methods=["GET"])
def get_leaderboard():
    try:
        limit = request.args.get("limit", default=10, type=int)
        rows = query_db(
            """
            SELECT s.fullName, s.studentID, s.email,
                   COALESCE(SUM(a.points), 0) AS score
            FROM students s
            LEFT JOIN actions a ON a.studentID = s.studentID
            GROUP BY s.studentID
            ORDER BY score ASC
            """
        )
        leaderboard = [dict(r) for r in rows][: max(limit, 0)]
        return jsonify(leaderboard), 200
    except Exception as e:
        logging.exception("Failed to get leaderboard")
        return jsonify({"error": "server error"}), 500

@app.route("/api/actions", methods=["GET"])
def get_actions():
    try:
        studentID = request.args.get("studentID", default="", type=str).strip()
        if not studentID:
            return jsonify({"error": "studentID is required"}), 400
        rows = query_db(
            "SELECT id, action_type, points, meta, created_at FROM actions WHERE studentID = ? ORDER BY created_at DESC",
            (studentID,),
        )
        return jsonify([dict(r) for r in rows]), 200
    except Exception as e:
        logging.exception("Failed to get actions")
        return jsonify({"error": "server error"}), 500

@app.route("/api/clear-students-data", methods=["POST"])
def clear_students():
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute("DELETE FROM students")
        c.execute("DELETE FROM actions")
        conn.commit()
        conn.close()
        logging.info("All student data cleared successfully.")
        return jsonify({"success": True, "message": "All student entries cleared."}), 200
    except Exception as e:
        logging.exception("Failed to clear students data")
        return jsonify({"error": f"Failed to clear data: {str(e)}"}), 500

@app.route("/api/export-students-data", methods=["GET"])
def export_students():
    try:
        rows = query_db("SELECT * FROM students ORDER BY created_at DESC")
        
        if not rows:
            return jsonify({"error": "No data to export"}), 404

        keys = rows[0].keys()
        si = StringIO()
        writer = csv.DictWriter(si, fieldnames=keys)
        writer.writeheader()
        
        for row in rows:
            writer.writerow(dict(row))

        output = make_response(si.getvalue())
        output.headers["Content-Disposition"] = "attachment; filename=phishing_simulation_data.csv"
        output.headers["Content-type"] = "text/csv"
        
        logging.info("Student data exported to CSV.")
        return output

    except Exception as e:
        logging.exception("Failed to export students data to CSV")
        return jsonify({"error": f"Failed to export data: {str(e)}"}), 500

@app.route("/api/generate-phishing", methods=["POST"])
def generate_phishing():
    try:
        request_data = request.get_json()
        user_prompt = request_data.get("prompt")
        if not user_prompt:
            return jsonify({"error": "Prompt is missing"}), 400
            
        phishing_link = "https://adversarialattacksimulator.netlify.app"

        master_prompt = f"""
        Act as a cybersecurity expert creating a realistic phishing simulation for an educational project.
        Your task is to generate a convincing phishing email based on the following scenario.

        Crucially, you MUST include the following fake phishing link exactly as provided: {phishing_link}
        
        Scenario: "{user_prompt}"

        Respond with ONLY a valid JSON object in the following format:
        {{
          "subject": "Your Phishing Email Subject Line",
          "body": "Your phishing email body text here. Make sure to embed the link naturally in the text."
        }}
        """

      # NEW - Correct model
        model = genai.GenerativeModel('gemini-2.5-pro')
        response = model.generate_content(master_prompt)
        
        cleaned_text = response.text.strip().replace("`", "")
        if cleaned_text.startswith("json"):
            cleaned_text = cleaned_text[4:]
        
        parsed_response = json.loads(cleaned_text)

        logging.info(f"Generated phishing content for prompt: {user_prompt}")
        return jsonify(parsed_response), 200

    except Exception as e:
        logging.exception("LLM generation failed")
        return jsonify({"error": f"An error occurred during generation: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
