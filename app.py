from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

notes = []  # in-memory storage, resets on restart (fine for a demo)


@app.route("/")
def home():
    return render_template("index.html")


@app.get("/api/health")
def health():
    return jsonify(status="ok")


@app.get("/api/notes")
def list_notes():
    return jsonify(notes)


@app.post("/api/notes")
def add_note():
    data = request.get_json(silent=True) or {}
    text = (data.get("text") or "").strip()
    if not text:
        return jsonify(error="text required"), 400
    note = {"id": len(notes) + 1, "text": text}
    notes.append(note)
    return jsonify(note), 201


if __name__ == "__main__":
    app.run(debug=True)
