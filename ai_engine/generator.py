"""
generator.py — Core AI Engine
Orchestrates the full prompt → parse → response pipeline.

Flow:
  1. build_prompt()   — constructs the system + user prompt
  2. call_ai()        — sends to AI API (OpenAI / Claude-compatible)
  3. parse_ai_output()— validates and normalises the JSON response
  4. template fallback— if AI is unavailable, use built-in templates

To switch AI provider, change call_ai() below.
Set your API key in the environment:  export OPENAI_API_KEY=sk-...
"""

import os
import re
from typing import Dict, Any

from ai_engine.prompt_builder import build_prompt
from ai_engine.parser import parse_ai_output, ParseError

# ── Built-in fallback templates (no AI key required) ─────────────
FALLBACK_TEMPLATES: Dict[str, Dict[str, Any]] = {
    "todo": {
        "app_name": "Todo App",
        "entities": ["Task", "User", "Category"],
        "apis": [
            {"method":"GET",    "path":"/tasks",           "desc":"List all tasks"},
            {"method":"POST",   "path":"/tasks",           "desc":"Create a task"},
            {"method":"GET",    "path":"/tasks/{id}",      "desc":"Get task by ID"},
            {"method":"PUT",    "path":"/tasks/{id}",      "desc":"Update task"},
            {"method":"DELETE", "path":"/tasks/{id}",      "desc":"Delete task"},
            {"method":"PATCH",  "path":"/tasks/{id}/done", "desc":"Mark complete"},
            {"method":"GET",    "path":"/categories",      "desc":"List categories"},
            {"method":"POST",   "path":"/categories",      "desc":"Create category"},
        ],
        "database": [
            {"table":"Tasks",      "fields":"id INT PK, title VARCHAR, status ENUM, due_date DATE, user_id FK"},
            {"table":"Users",      "fields":"id INT PK, username VARCHAR, email VARCHAR"},
            {"table":"Categories", "fields":"id INT PK, name VARCHAR, color VARCHAR"},
        ],
        "suggestions": [
            "Add due-date reminders with email / push notifications",
            "Implement priority levels (Low, Medium, High, Urgent)",
            "Add subtask / checklist items inside each task",
            "Support recurring tasks (daily, weekly, monthly)",
        ],
        "sample_code": (
            "from fastapi import FastAPI, HTTPException\n"
            "from pydantic import BaseModel\n"
            "from typing import Optional, List\n\n"
            "app = FastAPI(title='Todo App API')\n\n"
            "class Task(BaseModel):\n"
            "    title: str\n"
            "    status: str = 'pending'\n\n"
            "tasks_db: List[dict] = []\n"
            "counter = 1\n\n"
            "@app.get('/tasks')\n"
            "def get_tasks():\n"
            "    return tasks_db\n\n"
            "@app.post('/tasks', status_code=201)\n"
            "def create_task(task: Task):\n"
            "    global counter\n"
            "    new = {'id': counter, **task.dict()}\n"
            "    tasks_db.append(new)\n"
            "    counter += 1\n"
            "    return new\n\n"
            "@app.delete('/tasks/{task_id}', status_code=204)\n"
            "def delete_task(task_id: int):\n"
            "    global tasks_db\n"
            "    tasks_db = [t for t in tasks_db if t['id'] != task_id]\n"
        ),
    },
    "student": {
        "app_name": "Student Management System",
        "entities": ["Student", "Course", "Grade", "Teacher", "Attendance"],
        "apis": [
            {"method":"GET",    "path":"/students",             "desc":"List students"},
            {"method":"POST",   "path":"/students",             "desc":"Enroll student"},
            {"method":"GET",    "path":"/students/{id}",        "desc":"Student profile"},
            {"method":"PUT",    "path":"/students/{id}",        "desc":"Update student"},
            {"method":"DELETE", "path":"/students/{id}",        "desc":"Remove student"},
            {"method":"GET",    "path":"/students/{id}/grades", "desc":"Get grades"},
            {"method":"POST",   "path":"/students/{id}/grades", "desc":"Add grade"},
            {"method":"POST",   "path":"/attendance",           "desc":"Mark attendance"},
            {"method":"GET",    "path":"/courses",              "desc":"List courses"},
            {"method":"POST",   "path":"/courses",              "desc":"Create course"},
        ],
        "database": [
            {"table":"Students",   "fields":"id INT PK, name VARCHAR, email VARCHAR, roll_no VARCHAR, dept VARCHAR"},
            {"table":"Courses",    "fields":"id INT PK, name VARCHAR, code VARCHAR, credits INT, teacher_id FK"},
            {"table":"Grades",     "fields":"id INT PK, student_id FK, course_id FK, marks FLOAT, grade CHAR"},
            {"table":"Attendance", "fields":"id INT PK, student_id FK, course_id FK, date DATE, status ENUM"},
        ],
        "suggestions": [
            "Add GPA auto-calculation from all semester grades",
            "Filter students by department or semester",
            "Send alerts when attendance drops below 75%",
            "Add performance trend charts per student",
        ],
        "sample_code": (
            "from fastapi import FastAPI, HTTPException\n"
            "from pydantic import BaseModel\n"
            "from typing import Optional, List\n\n"
            "app = FastAPI(title='Student Management System API')\n\n"
            "class Student(BaseModel):\n"
            "    name: str\n"
            "    email: str\n"
            "    roll_no: str\n"
            "    department: str\n\n"
            "students_db: List[dict] = []\n"
            "counter = 1\n\n"
            "@app.get('/students')\n"
            "def list_students():\n"
            "    return students_db\n\n"
            "@app.post('/students', status_code=201)\n"
            "def enroll_student(student: Student):\n"
            "    global counter\n"
            "    new = {'id': counter, **student.dict()}\n"
            "    students_db.append(new)\n"
            "    counter += 1\n"
            "    return new\n"
        ),
    },
}


def _match_template_key(prompt: str) -> str | None:
    """Return a FALLBACK_TEMPLATES key if the prompt matches a known type."""
    p = prompt.lower()
    if re.search(r'\btodo\b|task|checklist', p):             return "todo"
    if re.search(r'student|school|\bgrade|\bmarks|attend', p): return "student"
    return None


def call_ai(prompt: str) -> str:
    """
    Send a prompt to the configured AI backend.

    Supported providers (set via env vars):
      - OpenAI:   OPENAI_API_KEY
      - Anthropic: ANTHROPIC_API_KEY  (Claude)

    Returns the raw text response from the model.
    Raises RuntimeError if no API key is configured.
    """
    prompts = build_prompt(prompt)

    # ── Try OpenAI ───────────────────────────────────────────────
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:
        try:
            import openai
            client = openai.OpenAI(api_key=api_key)
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system",  "content": prompts["system"]},
                    {"role": "user",    "content": prompts["user"]},
                ],
                max_tokens=2000,
                temperature=0.3,
            )
            return response.choices[0].message.content
        except Exception as exc:
            raise RuntimeError(f"OpenAI call failed: {exc}") from exc

    # ── Try Anthropic (Claude) ───────────────────────────────────
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if api_key:
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=api_key)
            message = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=2000,
                system=prompts["system"],
                messages=[{"role": "user", "content": prompts["user"]}],
            )
            return message.content[0].text
        except Exception as exc:
            raise RuntimeError(f"Anthropic call failed: {exc}") from exc

    raise RuntimeError(
        "No AI API key found. Set OPENAI_API_KEY or ANTHROPIC_API_KEY "
        "in your environment, or the generator will use built-in templates."
    )


def generate_crud_app(prompt: str) -> Dict[str, Any]:
    """
    Main entry point called by routes.py.

    1. Attempt to call the configured AI backend.
    2. Parse and validate the response.
    3. On any failure, fall back to a built-in template.

    Args:
        prompt: The user's free-text app description.

    Returns:
        A dict matching the GenerateResponse schema in models.py.
    """
    # ── Attempt AI generation ────────────────────────────────────
    try:
        raw_response = call_ai(prompt)
        return parse_ai_output(raw_response)

    except (RuntimeError, ParseError) as exc:
        print(f"[generator] AI unavailable ({exc}). Using template fallback.")

    # ── Fallback: built-in template ──────────────────────────────
    key = _match_template_key(prompt)
    if key:
        return FALLBACK_TEMPLATES[key]

    # ── Generic dynamic fallback ─────────────────────────────────
    from backend.utils import extract_entity_name, infer_app_name
    entity   = extract_entity_name(prompt)
    resource = entity.lower() + "s"
    app_name = infer_app_name(prompt)

    return {
        "app_name":  app_name,
        "entities":  [entity, "User", "Category"],
        "apis": [
            {"method":"GET",    "path":f"/{resource}",      "desc":f"List all {resource}"},
            {"method":"POST",   "path":f"/{resource}",      "desc":f"Create {entity.lower()}"},
            {"method":"GET",    "path":f"/{resource}/{{id}}","desc":f"Get {entity.lower()} by ID"},
            {"method":"PUT",    "path":f"/{resource}/{{id}}","desc":f"Update {entity.lower()}"},
            {"method":"DELETE", "path":f"/{resource}/{{id}}","desc":f"Delete {entity.lower()}"},
            {"method":"GET",    "path":"/users",            "desc":"List users"},
            {"method":"POST",   "path":"/users",            "desc":"Register user"},
        ],
        "database": [
            {"table":f"{entity}s", "fields":"id INT PK, name VARCHAR, description TEXT, user_id FK, created_at TIMESTAMP"},
            {"table":"Users",      "fields":"id INT PK, username VARCHAR, email VARCHAR, password_hash VARCHAR"},
        ],
        "suggestions": [
            f"Add full-text search for {resource}",
            "Implement JWT authentication and role-based access control",
            "Add pagination (limit/offset) to all list endpoints",
            "Use soft delete (is_deleted flag) instead of hard deletes",
        ],
        "sample_code": (
            f"from fastapi import FastAPI, HTTPException\n"
            f"from pydantic import BaseModel\n"
            f"from typing import Optional, List\n\n"
            f"app = FastAPI(title='{app_name} API')\n\n"
            f"class {entity}(BaseModel):\n"
            f"    name: str\n"
            f"    description: Optional[str] = None\n\n"
            f"items_db: List[dict] = []\n"
            f"counter = 1\n\n"
            f"@app.get('/{resource}')\n"
            f"def list_items():\n"
            f"    return items_db\n\n"
            f"@app.post('/{resource}', status_code=201)\n"
            f"def create_item(item: {entity}):\n"
            f"    global counter\n"
            f"    new = {{'id': counter, **item.dict()}}\n"
            f"    items_db.append(new)\n"
            f"    counter += 1\n"
            f"    return new\n"
        ),
    }
