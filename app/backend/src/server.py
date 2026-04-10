import json
import os
from datetime import datetime, timezone

from flask import Flask, jsonify, request
from flask_cors import CORS

from generate import generate_once

app = Flask(__name__)
CORS(app)

BUG_REPORTS_PATH = os.path.join(
    os.path.realpath(os.path.join(os.path.dirname(__file__), '..', 'data')),
    'bug_reports.json',
)


@app.get("/api/health")
def health():
    return jsonify({"ok": True})


@app.post("/api/translate")
def translate():
    data = request.get_json(silent=True) or {}
    text = str(data.get("text", "")).strip()

    if not text:
        return jsonify({"error": "Text is required."}), 400

    try:
        result = generate_once(text)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.post("/api/bug-report")
def bug_report():
    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()
    contact = str(data.get("contact", "")).strip()
    description = str(data.get("description", "")).strip()

    if not description:
        return jsonify({"error": "Description is required."}), 400

    reports = []
    try:
        if os.path.exists(BUG_REPORTS_PATH):
            with open(BUG_REPORTS_PATH, "r") as f:
                content = f.read().strip()
                if content:
                    reports = json.loads(content)
    except (json.JSONDecodeError, OSError):
        reports = []

    reports.append({
        "name": name or "Anonymous",
        "contact": contact,
        "description": description,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    os.makedirs(os.path.dirname(BUG_REPORTS_PATH), exist_ok=True)
    with open(BUG_REPORTS_PATH, "w") as f:
        json.dump(reports, f, indent=2)

    return jsonify({"ok": True})


if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=False)