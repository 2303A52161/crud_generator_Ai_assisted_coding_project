# ⚙️ CRUD Architect — Prompt-Based CRUD Generator

> Describe your app in plain English → Get entities, REST APIs, database schema, and sample FastAPI code instantly.

![CRUD Architect](https://img.shields.io/badge/Built%20With-FastAPI%20%7C%20Vanilla%20JS-7c6dfa?style=flat-square)
![GitHub Pages](https://img.shields.io/badge/Frontend-GitHub%20Pages-fa6d9f?style=flat-square)
![Python](https://img.shields.io/badge/Python-3.11%2B-6dfacc?style=flat-square)

---

## 📌 What Is This?

**CRUD Architect** is a mini web tool that takes a plain-English prompt like:

> *"Build a student management system with grades and attendance"*

…and instantly generates:

| Output | Example |
|--------|---------|
| **Entities / Models** | Student, Course, Grade, Teacher |
| **REST API Endpoints** | `GET /students`, `POST /students/{id}/grades` … |
| **Database Schema** | `Students(id, name, email, roll_no, dept)` |
| **Sample FastAPI Code** | Full Python routes with Pydantic models |
| **AI Suggestions** | "Add GPA auto-calculation", "Send low-attendance alerts" |

---

## 🗂️ Project Structure

```
prompt-crud-generator/
│
├── frontend/                  ← Pure HTML/CSS/JS (2 pages)
│   ├── index.html             ← Prompt input page
│   ├── result.html            ← Output display page
│   ├── style.css              ← Shared stylesheet
│   └── script.js              ← Template engine + rendering logic
│
├── backend/                   ← FastAPI server
│   ├── main.py                ← App entry point + CORS setup
│   ├── routes.py              ← POST /api/generate endpoint
│   ├── models.py              ← Pydantic request / response models
│   └── utils.py               ← Helper functions (slugify, extract entity …)
│
├── ai_engine/                 ← AI processing pipeline
│   ├── generator.py           ← Orchestrates prompt → parse → response
│   ├── prompt_builder.py      ← Builds system + user prompt for the AI
│   └── parser.py              ← Validates and normalises AI JSON output
│
├── templates/                 ← Reusable code templates
│   ├── fastapi_crud.py        ← Parametric FastAPI CRUD template
│   └── schema.sql             ← Generic PostgreSQL starter schema
│
├── outputs/
│   └── last_generated.json    ← Cached last result (for demo / debugging)
│
├── requirements.txt
└── README.md
```

---

## 🚀 Quick Start — Frontend Only (GitHub Pages)

The frontend works completely without a backend. No server needed.

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/prompt-crud-generator.git
cd prompt-crud-generator
```

### 2. Open in a browser
```bash
# Option A — just double-click frontend/index.html
# Option B — use a local server
cd frontend
python -m http.server 8080
# then open http://localhost:8080
```

### 3. Deploy to GitHub Pages
```bash
# In your GitHub repo → Settings → Pages
# Source: Deploy from branch
# Branch: main  /  folder: /frontend
```

Your live URL will be: `https://<your-username>.github.io/prompt-crud-generator/`

---

## ⚙️ Full Stack Setup (Backend + AI)

### Prerequisites
- Python 3.11+
- An OpenAI **or** Anthropic API key (optional — falls back to built-in templates)

### 1. Install dependencies
```bash
pip install -r requirements.txt
```

### 2. Set your API key (optional)
```bash
# For OpenAI
export OPENAI_API_KEY=sk-...

# For Anthropic (Claude)
export ANTHROPIC_API_KEY=sk-ant-...
```

Or create a `.env` file in the project root:
```
OPENAI_API_KEY=sk-...
```

### 3. Run the backend
```bash
cd backend
uvicorn main:app --reload
```

Backend runs at: `http://localhost:8000`  
Swagger docs at: `http://localhost:8000/docs`

### 4. Test the API
```bash
curl -X POST http://localhost:8000/api/generate \
     -H "Content-Type: application/json" \
     -d '{"prompt": "Build a student management system"}'
```

---

## 🔄 End-to-End Flow

```
User enters prompt on index.html
           ↓
    script.js → matchKey(prompt)
           ↓
  Template found?
   ├─ YES → Load built-in template
   └─ NO  → generateDynamic(prompt)
           ↓
  Save to sessionStorage as JSON
           ↓
  Navigate to result.html
           ↓
  loadResult() reads sessionStorage
           ↓
  renderOutput() fills all cards:
    ├── Entities
    ├── REST API Endpoints
    ├── Database Schema
    ├── AI Suggestions
    └── Sample FastAPI Code
```

When the **backend** is running, the frontend can also call `POST /api/generate`, which routes through:

```
routes.py → generator.py → prompt_builder.py → AI API → parser.py → JSON response
```

---

## 📄 API Reference

### `POST /api/generate`

**Request body:**
```json
{ "prompt": "Build a student management system" }
```

**Response:**
```json
{
  "app_name":    "Student Management System",
  "entities":    ["Student", "Course", "Grade"],
  "apis": [
    { "method": "GET",  "path": "/students",        "desc": "List all students" },
    { "method": "POST", "path": "/students",        "desc": "Enroll student" },
    { "method": "GET",  "path": "/students/{id}",   "desc": "Get profile" }
  ],
  "database": [
    { "table": "Students", "fields": "id INT PK, name VARCHAR, email VARCHAR" }
  ],
  "suggestions": ["Add GPA calculation", "Add attendance alerts"],
  "sample_code": "# FastAPI code here..."
}
```

### `GET /api/health`
Returns `{ "status": "ok" }`.

---

## 🌐 Deploy to GitHub Pages (Step-by-Step)

1. **Push your code** to a GitHub repository.

2. Go to your repo → **Settings** → **Pages**.

3. Under **Source**, choose:
   - Branch: `main`
   - Folder: `/frontend`

4. Click **Save**.

5. Wait ~60 seconds, then visit:
   ```
   https://<your-username>.github.io/prompt-crud-generator/
   ```

> **Tip:** The frontend works 100% standalone on GitHub Pages. The backend (FastAPI) would need a separate host like [Railway](https://railway.app), [Render](https://render.com), or [Fly.io](https://fly.io).

---

## 🛠️ Built With

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend  | Python 3.11, FastAPI, Pydantic |
| AI       | OpenAI GPT-4o-mini / Anthropic Claude |
| Deploy   | GitHub Pages (frontend), Railway / Render (backend) |

---

## 👨‍💻 Author

Built as a college project demonstrating prompt engineering, REST API design, and full-stack web development.

---

## 📝 License

MIT License — feel free to use, modify, and share.
