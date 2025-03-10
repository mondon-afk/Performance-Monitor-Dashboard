from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
import time
import sqlite3

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

def init_db():
    conn = sqlite3.connect('monitoring.db')
    cursor = conn.cursor
    cursor.execute('''CREATE TABLE IF NOT EXISTS response_times (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        url TEXT,
                        status_code INTEGER,
                        response_time_ms REAL,
                        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)''')
    conn.commit()
    conn.close()

def measure_response_time(url):
    """Measures response time for a given URL."""
    try:
        start_time = time.time()
        response = requests.get(url, timeout=10)
        end_time = time.time()
        response_time = round((end_time - start_time) * 1000, 2)  # Convert to milliseconds

        conn = sqlite3.connect('monitoring.db')
        cursor = conn.cursor()
        cursor.execute("INSERT INTO response_times (url, status_code, response_time_ms) VALUES (?, ?, ?)", 
                       (url, response.status_code, response_time))
        conn.commit()
        conn.close()


        return {"url": url, "status_code": response.status_code, "response_time_ms": response_time}
    except requests.exceptions.RequestException as e:
        return {"url": url, "error": str(e)}

@app.route('/monitor', methods=['GET'])
def monitor():
    """API endpoint to check response time of a given URL."""
    url = request.args.get('url')
    if not url:
        return jsonify({"error": "Please provide a URL as a query parameter."}), 400
    
    result = measure_response_time(url)
    return jsonify(result)

@app.route('/history', methods=['GET'])
def history():
    """Fetches historical response times."""
    conn = sqlite3.connect('monitoring.db')
    cursor = conn.cursor()
    cursor.execute("SELECT url, status_code, response_time_ms, timestamp FROM response_times ORDER BY timestamp DESC LIMIT 10")
    records = cursor.fetchall()
    conn.close()
    
    history_data = [{"url": row[0], "status_code": row[1], "response_time_ms": row[2], "timestamp": row[3]} for row in records]
    return jsonify(history_data)

if __name__ == '__main__':
    app.run(debug=True)
