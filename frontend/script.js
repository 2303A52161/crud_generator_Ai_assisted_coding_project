/**
 * CRUD Architect — script.js
 * Shared JavaScript for index.html (input) and result.html (output).
 *
 * Flow:
 *   1. User enters prompt on index.html
 *   2. handleGenerate() matches a template or builds a dynamic one
 *   3. Result is saved to sessionStorage as JSON
 *   4. Browser navigates to result.html
 *   5. loadResult() reads sessionStorage and renders the full output
 */

"use strict";

/* ================================================================
   TEMPLATE DATA
   Five pre-built templates covering the most common app types.
   Each template contains:
     app_name  – display name
     entities  – list of model/entity names
     apis      – array of { m, p, d } (method, path, description)
     db        – array of { t, f }   (table name, fields)
     sug       – array of suggestion strings
     code      – raw FastAPI Python code string
   ================================================================ */

const TEMPLATES = {

  /* ── Todo App ────────────────────────────────────────────── */
  todo: {
    app_name: "Todo App",
    entities: ["Task", "User", "Category"],
    apis: [
      { m:"GET",    p:"/tasks",            d:"List all tasks" },
      { m:"POST",   p:"/tasks",            d:"Create a new task" },
      { m:"GET",    p:"/tasks/{id}",       d:"Get task by ID" },
      { m:"PUT",    p:"/tasks/{id}",       d:"Update a task" },
      { m:"DELETE", p:"/tasks/{id}",       d:"Delete a task" },
      { m:"PATCH",  p:"/tasks/{id}/done",  d:"Mark task complete" },
      { m:"GET",    p:"/categories",       d:"List categories" },
      { m:"POST",   p:"/categories",       d:"Create category" },
      { m:"GET",    p:"/users/{id}/tasks", d:"Get tasks by user" },
    ],
    db: [
      { t:"Tasks",      f:"id INT PK, title VARCHAR, status ENUM(pending,done), due_date DATE, user_id FK, category_id FK" },
      { t:"Users",      f:"id INT PK, username VARCHAR, email VARCHAR, created_at TIMESTAMP" },
      { t:"Categories", f:"id INT PK, name VARCHAR, color VARCHAR, user_id FK" },
    ],
    sug: [
      "Add due-date reminders with email / push notifications",
      "Implement priority levels — Low, Medium, High, Urgent",
      "Add subtask / checklist items inside each task",
      "Support recurring tasks (daily, weekly, monthly)",
    ],
    code:
`from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import date

app = FastAPI(title="Todo App API", version="1.0.0")

# ─── Models ────────────────────────────────────────────
class Task(BaseModel):
    title: str
    status: str = "pending"
    due_date: Optional[date] = None
    category_id: Optional[int] = None

class TaskResponse(Task):
    id: int

# In-memory store (replace with SQLAlchemy + PostgreSQL)
tasks_db: List[dict] = []
counter: int = 1

# ─── Routes ────────────────────────────────────────────
@app.get("/tasks", response_model=List[TaskResponse])
def get_tasks(status: Optional[str] = None):
    """Return all tasks, optionally filtered by status."""
    if status:
        return [t for t in tasks_db if t["status"] == status]
    return tasks_db

@app.post("/tasks", response_model=TaskResponse, status_code=201)
def create_task(task: Task):
    """Create a new task and return it with its assigned ID."""
    global counter
    new_task = {"id": counter, **task.dict()}
    tasks_db.append(new_task)
    counter += 1
    return new_task

@app.get("/tasks/{task_id}", response_model=TaskResponse)
def get_task(task_id: int):
    task = next((t for t in tasks_db if t["id"] == task_id), None)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@app.put("/tasks/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, task: Task):
    for i, t in enumerate(tasks_db):
        if t["id"] == task_id:
            tasks_db[i] = {"id": task_id, **task.dict()}
            return tasks_db[i]
    raise HTTPException(status_code=404, detail="Task not found")

@app.patch("/tasks/{task_id}/done")
def mark_done(task_id: int):
    for t in tasks_db:
        if t["id"] == task_id:
            t["status"] = "completed"
            return {"message": "Task marked complete", "id": task_id}
    raise HTTPException(status_code=404, detail="Task not found")

@app.delete("/tasks/{task_id}", status_code=204)
def delete_task(task_id: int):
    global tasks_db
    tasks_db = [t for t in tasks_db if t["id"] != task_id]`
  },

  /* ── Student Management ──────────────────────────────────── */
  student: {
    app_name: "Student Management System",
    entities: ["Student", "Course", "Grade", "Teacher", "Attendance"],
    apis: [
      { m:"GET",    p:"/students",                  d:"List all students" },
      { m:"POST",   p:"/students",                  d:"Enroll new student" },
      { m:"GET",    p:"/students/{id}",             d:"Get student profile" },
      { m:"PUT",    p:"/students/{id}",             d:"Update student info" },
      { m:"DELETE", p:"/students/{id}",             d:"Remove student" },
      { m:"GET",    p:"/students/{id}/grades",      d:"Get student grades" },
      { m:"POST",   p:"/students/{id}/grades",      d:"Add grade entry" },
      { m:"GET",    p:"/students/{id}/attendance",  d:"Get attendance record" },
      { m:"POST",   p:"/attendance",                d:"Mark attendance" },
      { m:"GET",    p:"/courses",                   d:"List all courses" },
      { m:"POST",   p:"/courses",                   d:"Create course" },
      { m:"GET",    p:"/courses/{id}/students",     d:"Students in course" },
    ],
    db: [
      { t:"Students",   f:"id INT PK, name VARCHAR, email VARCHAR, roll_no VARCHAR, dob DATE, department VARCHAR" },
      { t:"Courses",    f:"id INT PK, name VARCHAR, code VARCHAR, credits INT, teacher_id FK" },
      { t:"Grades",     f:"id INT PK, student_id FK, course_id FK, marks FLOAT, grade CHAR, semester INT" },
      { t:"Attendance", f:"id INT PK, student_id FK, course_id FK, date DATE, status ENUM(present,absent,late)" },
      { t:"Teachers",   f:"id INT PK, name VARCHAR, email VARCHAR, department VARCHAR" },
    ],
    sug: [
      "Add GPA auto-calculation from all semester grades",
      "Filter students by department or semester",
      "Send alerts when attendance drops below 75%",
      "Add performance trend charts per student",
    ],
    code:
`from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from enum import Enum

app = FastAPI(title="Student Management System API", version="1.0.0")

# ─── Enums ─────────────────────────────────────────────
class AttendanceStatus(str, Enum):
    present = "present"
    absent  = "absent"
    late    = "late"

# ─── Models ────────────────────────────────────────────
class Student(BaseModel):
    name: str
    email: str
    roll_no: str
    department: str
    dob: Optional[str] = None

class Grade(BaseModel):
    course_id: int
    marks: float
    semester: int

class AttendanceRecord(BaseModel):
    student_id: int
    course_id: int
    date: str
    status: AttendanceStatus

# In-memory stores
students_db:   List[dict] = []
grades_db:     List[dict] = []
attendance_db: List[dict] = []
c = {"s": 1, "g": 1, "a": 1}

# ─── Routes ────────────────────────────────────────────
@app.get("/students")
def list_students(department: Optional[str] = None):
    if department:
        return [s for s in students_db if s["department"] == department]
    return students_db

@app.post("/students", status_code=201)
def enroll_student(student: Student):
    new = {"id": c["s"], **student.dict()}
    students_db.append(new)
    c["s"] += 1
    return new

@app.get("/students/{sid}")
def get_student(sid: int):
    s = next((s for s in students_db if s["id"] == sid), None)
    if not s:
        raise HTTPException(404, "Student not found")
    return s

@app.get("/students/{sid}/grades")
def get_grades(sid: int):
    return [g for g in grades_db if g["student_id"] == sid]

@app.post("/students/{sid}/grades", status_code=201)
def add_grade(sid: int, grade: Grade):
    letter = (
        "A" if grade.marks >= 90 else
        "B" if grade.marks >= 80 else
        "C" if grade.marks >= 70 else
        "D" if grade.marks >= 60 else "F"
    )
    new = {"id": c["g"], "student_id": sid, "grade": letter, **grade.dict()}
    grades_db.append(new)
    c["g"] += 1
    return new

@app.post("/attendance", status_code=201)
def mark_attendance(record: AttendanceRecord):
    new = {"id": c["a"], **record.dict()}
    attendance_db.append(new)
    c["a"] += 1
    return new

@app.delete("/students/{sid}", status_code=204)
def remove_student(sid: int):
    global students_db
    students_db = [s for s in students_db if s["id"] != sid]`
  },

  /* ── Notes App ───────────────────────────────────────────── */
  notes: {
    app_name: "Notes App",
    entities: ["Note", "Tag", "User", "Notebook"],
    apis: [
      { m:"GET",    p:"/notes",                    d:"List all notes" },
      { m:"POST",   p:"/notes",                    d:"Create a note" },
      { m:"GET",    p:"/notes/{id}",               d:"Get note by ID" },
      { m:"PUT",    p:"/notes/{id}",               d:"Update note" },
      { m:"DELETE", p:"/notes/{id}",               d:"Delete note" },
      { m:"GET",    p:"/notes/search",             d:"Search notes by keyword" },
      { m:"GET",    p:"/tags",                     d:"List all tags" },
      { m:"POST",   p:"/tags",                     d:"Create a tag" },
      { m:"POST",   p:"/notes/{id}/tags",          d:"Add tag to note" },
      { m:"DELETE", p:"/notes/{id}/tags/{tag_id}", d:"Remove tag from note" },
      { m:"GET",    p:"/notebooks",                d:"List notebooks" },
      { m:"POST",   p:"/notebooks",                d:"Create notebook" },
    ],
    db: [
      { t:"Notes",     f:"id INT PK, title VARCHAR, content TEXT, user_id FK, notebook_id FK, created_at TIMESTAMP, updated_at TIMESTAMP" },
      { t:"Tags",      f:"id INT PK, name VARCHAR, color VARCHAR, user_id FK" },
      { t:"NoteTags",  f:"note_id FK, tag_id FK  (composite PK)" },
      { t:"Notebooks", f:"id INT PK, name VARCHAR, description TEXT, user_id FK" },
    ],
    sug: [
      "Add full-text search with keyword highlighting",
      "Support Markdown rendering in note content",
      "Add note pinning and archiving features",
      "Generate public share links with read-only access",
    ],
    code:
`from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

app = FastAPI(title="Notes App API", version="1.0.0")

# ─── Models ────────────────────────────────────────────
class Note(BaseModel):
    title: str
    content: str
    notebook_id: Optional[int] = None

class Tag(BaseModel):
    name: str
    color: str = "#7c6dfa"

# In-memory stores
notes_db: List[dict] = []
tags_db:  List[dict] = []
c = {"note": 1, "tag": 1}

# ─── Routes ────────────────────────────────────────────
@app.get("/notes")
def list_notes(notebook_id: Optional[int] = None):
    if notebook_id:
        return [n for n in notes_db if n.get("notebook_id") == notebook_id]
    return notes_db

@app.post("/notes", status_code=201)
def create_note(note: Note):
    now = datetime.utcnow().isoformat()
    new = {"id": c["note"], **note.dict(),
           "tags": [], "created_at": now, "updated_at": now}
    notes_db.append(new)
    c["note"] += 1
    return new

@app.get("/notes/search")
def search_notes(q: str = Query(..., min_length=1)):
    """Full-text search across note title and content."""
    ql = q.lower()
    hits = [n for n in notes_db
            if ql in n["title"].lower() or ql in n["content"].lower()]
    return {"query": q, "count": len(hits), "results": hits}

@app.get("/notes/{note_id}")
def get_note(note_id: int):
    note = next((n for n in notes_db if n["id"] == note_id), None)
    if not note:
        raise HTTPException(404, "Note not found")
    return note

@app.put("/notes/{note_id}")
def update_note(note_id: int, note: Note):
    for i, n in enumerate(notes_db):
        if n["id"] == note_id:
            notes_db[i].update({**note.dict(),
                                 "updated_at": datetime.utcnow().isoformat()})
            return notes_db[i]
    raise HTTPException(404, "Note not found")

@app.delete("/notes/{note_id}", status_code=204)
def delete_note(note_id: int):
    global notes_db
    notes_db = [n for n in notes_db if n["id"] != note_id]

@app.post("/notes/{note_id}/tags")
def add_tag(note_id: int, tag_id: int):
    note = next((n for n in notes_db if n["id"] == note_id), None)
    if not note:
        raise HTTPException(404, "Note not found")
    if tag_id not in note["tags"]:
        note["tags"].append(tag_id)
    return {"message": "Tag added", "note_id": note_id, "tag_id": tag_id}`
  },

  /* ── E-Commerce ──────────────────────────────────────────── */
  ecommerce: {
    app_name: "E-Commerce Catalog",
    entities: ["Product", "Category", "Order", "Customer", "Cart", "Review"],
    apis: [
      { m:"GET",    p:"/products",               d:"List products with filters" },
      { m:"POST",   p:"/products",               d:"Add new product" },
      { m:"GET",    p:"/products/{id}",          d:"Get product details" },
      { m:"PUT",    p:"/products/{id}",          d:"Update product" },
      { m:"DELETE", p:"/products/{id}",          d:"Remove product" },
      { m:"GET",    p:"/products/{id}/reviews",  d:"Get product reviews" },
      { m:"POST",   p:"/products/{id}/reviews",  d:"Add a review" },
      { m:"GET",    p:"/categories",             d:"List categories" },
      { m:"POST",   p:"/cart",                   d:"Add item to cart" },
      { m:"GET",    p:"/cart/{user_id}",         d:"Get user cart" },
      { m:"DELETE", p:"/cart/{item_id}",         d:"Remove cart item" },
      { m:"POST",   p:"/orders",                 d:"Place an order" },
      { m:"GET",    p:"/orders/{id}",            d:"Get order details" },
    ],
    db: [
      { t:"Products",   f:"id INT PK, name VARCHAR, price DECIMAL, stock INT, category_id FK, description TEXT, image_url VARCHAR" },
      { t:"Categories", f:"id INT PK, name VARCHAR, parent_id FK" },
      { t:"Orders",     f:"id INT PK, customer_id FK, total DECIMAL, status ENUM, created_at TIMESTAMP" },
      { t:"OrderItems", f:"id INT PK, order_id FK, product_id FK, qty INT, price DECIMAL" },
      { t:"Cart",       f:"id INT PK, user_id FK, product_id FK, qty INT" },
      { t:"Reviews",    f:"id INT PK, product_id FK, user_id FK, rating INT, comment TEXT" },
    ],
    sug: [
      "Add price-range and star-rating filters on /products",
      "Send low-stock inventory alerts automatically",
      "Implement coupon and discount code support",
      "Add product recommendation engine based on purchase history",
    ],
    code:
`from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List

app = FastAPI(title="E-Commerce Catalog API", version="1.0.0")

# ─── Models ────────────────────────────────────────────
class Product(BaseModel):
    name: str
    price: float
    stock: int
    category_id: Optional[int] = None
    description: Optional[str] = None

class Review(BaseModel):
    user_id: int
    rating: int          # 1–5
    comment: Optional[str] = None

class CartItem(BaseModel):
    user_id: int
    product_id: int
    qty: int = 1

# In-memory stores
products_db: List[dict] = []
reviews_db:  List[dict] = []
cart_db:     List[dict] = []
c = {"p": 1, "r": 1, "cart": 1}

# ─── Routes ────────────────────────────────────────────
@app.get("/products")
def list_products(
    category_id: Optional[int] = None,
    min_price:   Optional[float] = None,
    max_price:   Optional[float] = None,
    in_stock:    bool = False,
):
    res = products_db[:]
    if category_id: res = [p for p in res if p.get("category_id") == category_id]
    if min_price:   res = [p for p in res if p["price"] >= min_price]
    if max_price:   res = [p for p in res if p["price"] <= max_price]
    if in_stock:    res = [p for p in res if p["stock"] > 0]
    return res

@app.post("/products", status_code=201)
def add_product(product: Product):
    new = {"id": c["p"], **product.dict()}
    products_db.append(new)
    c["p"] += 1
    return new

@app.get("/products/{pid}")
def get_product(pid: int):
    p = next((p for p in products_db if p["id"] == pid), None)
    if not p:
        raise HTTPException(404, "Product not found")
    p["reviews"]    = [r for r in reviews_db if r["product_id"] == pid]
    p["avg_rating"] = (
        sum(r["rating"] for r in p["reviews"]) / len(p["reviews"])
        if p["reviews"] else None
    )
    return p

@app.post("/products/{pid}/reviews", status_code=201)
def add_review(pid: int, review: Review):
    if not 1 <= review.rating <= 5:
        raise HTTPException(400, "Rating must be between 1 and 5")
    new = {"id": c["r"], "product_id": pid, **review.dict()}
    reviews_db.append(new)
    c["r"] += 1
    return new

@app.post("/cart", status_code=201)
def add_to_cart(item: CartItem):
    existing = next(
        (ci for ci in cart_db
         if ci["user_id"] == item.user_id and ci["product_id"] == item.product_id),
        None
    )
    if existing:
        existing["qty"] += item.qty
        return existing
    new = {"id": c["cart"], **item.dict()}
    cart_db.append(new)
    c["cart"] += 1
    return new`
  },

  /* ── Blog Platform ───────────────────────────────────────── */
  blog: {
    app_name: "Blog Platform",
    entities: ["Post", "Author", "Comment", "Tag", "Category"],
    apis: [
      { m:"GET",    p:"/posts",                   d:"List published posts" },
      { m:"POST",   p:"/posts",                   d:"Create new post" },
      { m:"GET",    p:"/posts/{id}",              d:"Get post with comments" },
      { m:"PUT",    p:"/posts/{id}",              d:"Update post" },
      { m:"DELETE", p:"/posts/{id}",              d:"Delete post" },
      { m:"POST",   p:"/posts/{id}/publish",      d:"Publish a draft post" },
      { m:"GET",    p:"/posts/{id}/comments",     d:"Get post comments" },
      { m:"POST",   p:"/posts/{id}/comments",     d:"Add a comment" },
      { m:"DELETE", p:"/comments/{id}",           d:"Delete comment" },
      { m:"GET",    p:"/tags",                    d:"List all tags" },
      { m:"GET",    p:"/posts/tag/{tag}",         d:"Posts by tag" },
      { m:"GET",    p:"/authors/{id}/posts",      d:"Posts by author" },
    ],
    db: [
      { t:"Posts",    f:"id INT PK, title VARCHAR, content TEXT, author_id FK, status ENUM(draft,published), slug VARCHAR, published_at TIMESTAMP" },
      { t:"Authors",  f:"id INT PK, name VARCHAR, email VARCHAR, bio TEXT, avatar_url VARCHAR" },
      { t:"Comments", f:"id INT PK, post_id FK, author_name VARCHAR, content TEXT, created_at TIMESTAMP" },
      { t:"Tags",     f:"id INT PK, name VARCHAR, slug VARCHAR" },
      { t:"PostTags", f:"post_id FK, tag_id FK  (composite PK)" },
    ],
    sug: [
      "Add SEO fields (meta description, canonical URL) to posts",
      "Track view count per post automatically",
      "Add comment moderation and approval workflow",
      "Add RSS feed endpoint at /feed.xml",
    ],
    code:
`from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import re

app = FastAPI(title="Blog Platform API", version="1.0.0")

# ─── Models ────────────────────────────────────────────
class Post(BaseModel):
    title: str
    content: str
    author_id: int
    tags: List[str] = []

class Comment(BaseModel):
    author_name: str
    content: str

# In-memory stores
posts_db:    List[dict] = []
comments_db: List[dict] = []
c = {"post": 1, "comment": 1}

def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")

# ─── Routes ────────────────────────────────────────────
@app.get("/posts")
def list_posts(status: str = "published"):
    return [p for p in posts_db if p["status"] == status]

@app.post("/posts", status_code=201)
def create_post(post: Post):
    new = {
        "id": c["post"],
        **post.dict(),
        "slug":         slugify(post.title),
        "status":       "draft",
        "published_at": None,
        "view_count":   0,
        "created_at":   datetime.utcnow().isoformat(),
    }
    posts_db.append(new)
    c["post"] += 1
    return new

@app.post("/posts/{post_id}/publish")
def publish_post(post_id: int):
    post = next((p for p in posts_db if p["id"] == post_id), None)
    if not post:
        raise HTTPException(404, "Post not found")
    post["status"]       = "published"
    post["published_at"] = datetime.utcnow().isoformat()
    return {"message": "Post published", "slug": post["slug"]}

@app.get("/posts/{post_id}")
def get_post(post_id: int):
    post = next((p for p in posts_db if p["id"] == post_id), None)
    if not post:
        raise HTTPException(404, "Post not found")
    post["view_count"] += 1
    post["comments"] = [cm for cm in comments_db if cm["post_id"] == post_id]
    return post

@app.post("/posts/{post_id}/comments", status_code=201)
def add_comment(post_id: int, comment: Comment):
    post = next((p for p in posts_db if p["id"] == post_id), None)
    if not post:
        raise HTTPException(404, "Post not found")
    new = {
        "id": c["comment"], "post_id": post_id,
        **comment.dict(), "created_at": datetime.utcnow().isoformat(),
    }
    comments_db.append(new)
    c["comment"] += 1
    return new

@app.delete("/comments/{cid}", status_code=204)
def delete_comment(cid: int):
    global comments_db
    comments_db = [cm for cm in comments_db if cm["id"] != cid]`
  },

};  // end TEMPLATES


/* ================================================================
   PROMPT MATCHING
   Maps a user's free-text prompt to one of the template keys.
   ================================================================ */

/**
 * matchKey(prompt) → string | null
 * Returns a TEMPLATES key if the prompt matches a known app type,
 * otherwise null (which triggers generateDynamic).
 */
function matchKey(prompt) {
  const p = prompt.toLowerCase();
  if (/\btodo\b|task|checklist/.test(p))                          return "todo";
  if (/student|school|\bgrade|\bmarks|attendance/.test(p))        return "student";
  if (/\bnote\b|notebook|journal/.test(p))                        return "notes";
  if (/ecommerce|e-commerce|product|shop|catalog|store|cart/.test(p)) return "ecommerce";
  if (/blog|article|\bpost\b|author/.test(p))                     return "blog";
  return null;
}


/* ================================================================
   DYNAMIC GENERATOR
   Builds a generic CRUD structure from any unrecognised prompt.
   ================================================================ */

/**
 * generateDynamic(prompt) → template object
 * Extracts the most meaningful word from the prompt and uses it
 * as the primary entity name, then scaffolds a full structure.
 */
function generateDynamic(prompt) {
  const STOP = new Set([
    "create","build","make","develop","design","a","an","the",
    "system","app","application","management","platform","with",
    "and","for","my","our","simple","basic","web","full","new"
  ]);

  const words = prompt
    .replace(/[^a-zA-Z\s]/g, "")
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP.has(w.toLowerCase()));

  const raw     = words[0] || "Item";
  const entity  = raw[0].toUpperCase() + raw.slice(1).toLowerCase();
  const resource= entity.toLowerCase() + "s";
  const appName = words.slice(0, 3).map(w => w[0].toUpperCase() + w.slice(1)).join(" ") + " App";

  return {
    app_name: appName,
    entities: [entity, "User", "Category"],
    apis: [
      { m:"GET",    p:`/${resource}`,        d:`List all ${resource}` },
      { m:"POST",   p:`/${resource}`,        d:`Create a ${entity.toLowerCase()}` },
      { m:"GET",    p:`/${resource}/{id}`,   d:`Get ${entity.toLowerCase()} by ID` },
      { m:"PUT",    p:`/${resource}/{id}`,   d:`Update ${entity.toLowerCase()}` },
      { m:"DELETE", p:`/${resource}/{id}`,   d:`Delete ${entity.toLowerCase()}` },
      { m:"GET",    p:`/${resource}/search`, d:`Search ${resource}` },
      { m:"GET",    p:`/users`,              d:"List users" },
      { m:"POST",   p:`/users`,              d:"Register user" },
      { m:"GET",    p:`/categories`,         d:"List categories" },
      { m:"POST",   p:`/categories`,         d:"Create category" },
    ],
    db: [
      { t:`${entity}s`,  f:`id INT PK, name VARCHAR, description TEXT, user_id FK, category_id FK, created_at TIMESTAMP` },
      { t:"Users",       f:"id INT PK, username VARCHAR, email VARCHAR, password_hash VARCHAR" },
      { t:"Categories",  f:"id INT PK, name VARCHAR, slug VARCHAR" },
    ],
    sug: [
      `Add search + filter support for ${resource}`,
      "Implement JWT authentication and role-based access control",
      "Add pagination (limit / offset) for all list endpoints",
      "Use soft delete (is_deleted flag) instead of hard delete",
    ],
    code:
`from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

app = FastAPI(title="${appName} API", version="1.0.0")

# ─── Model ─────────────────────────────────────────────
class ${entity}(BaseModel):
    name: str
    description: Optional[str] = None
    category_id: Optional[int] = None
    user_id:     Optional[int] = None

class ${entity}Response(${entity}):
    id: int
    created_at: str

# In-memory store (replace with SQLAlchemy + PostgreSQL)
items_db: List[dict] = []
counter: int = 1

# ─── Routes ────────────────────────────────────────────
@app.get("/${resource}", response_model=List[${entity}Response])
def list_items(
    category_id: Optional[int]  = None,
    search:      Optional[str]  = Query(None, min_length=1),
):
    result = items_db[:]
    if category_id:
        result = [i for i in result if i.get("category_id") == category_id]
    if search:
        result = [i for i in result if search.lower() in i["name"].lower()]
    return result

@app.post("/${resource}", response_model=${entity}Response, status_code=201)
def create_item(item: ${entity}):
    global counter
    new = {"id": counter, **item.dict(), "created_at": datetime.utcnow().isoformat()}
    items_db.append(new)
    counter += 1
    return new

@app.get("/${resource}/{item_id}", response_model=${entity}Response)
def get_item(item_id: int):
    item = next((i for i in items_db if i["id"] == item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="${entity} not found")
    return item

@app.put("/${resource}/{item_id}", response_model=${entity}Response)
def update_item(item_id: int, item: ${entity}):
    for idx, i in enumerate(items_db):
        if i["id"] == item_id:
            items_db[idx] = {"id": item_id, **item.dict(),
                             "created_at": i["created_at"]}
            return items_db[idx]
    raise HTTPException(status_code=404, detail="${entity} not found")

@app.delete("/${resource}/{item_id}", status_code=204)
def delete_item(item_id: int):
    global items_db
    items_db = [i for i in items_db if i["id"] != item_id]`
  };
}


/* ================================================================
   UTILITIES
   ================================================================ */

/** HTML-escape a string to prevent XSS */
function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Basic Python syntax highlighter */
function highlight(code) {
  return esc(code)
    .replace(
      /\b(from|import|def|class|return|if|else|elif|for|in|not|and|or|True|False|None|async|await|with|as|try|except|raise|global|pass|lambda|yield)\b/g,
      '<span class="kw">$1</span>'
    )
    .replace(/(#[^\n]*)/g,                '<span class="cm">$1</span>')
    .replace(/(@\w+)/g,                   '<span class="dec">$1</span>')
    .replace(/\b(\d+)\b/g,               '<span class="num">$1</span>')
    .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, '<span class="str">$1</span>');
}

/** Toggle loading bar and message visibility */
function showLoading(show) {
  const bar = document.getElementById("loadingBar");
  const msg = document.getElementById("loadingMsg");
  const btn = document.getElementById("generateBtn");
  if (bar) bar.classList.toggle("active", show);
  if (msg) msg.classList.toggle("active", show);
  if (btn) btn.disabled = show;
}

/** Set textarea value from an example chip */
function setPrompt(text) {
  const ta = document.getElementById("promptInput");
  if (ta) { ta.value = text; ta.focus(); }
}


/* ================================================================
   INDEX PAGE — handleGenerate()
   Called when the user clicks "Generate CRUD Structure".
   Matches the template, saves to sessionStorage, navigates to result.
   ================================================================ */

async function handleGenerate() {
  const promptEl = document.getElementById("promptInput");
  const errorEl  = document.getElementById("errorBox");
  const prompt   = promptEl ? promptEl.value.trim() : "";

  if (errorEl) errorEl.classList.remove("visible");
  if (!prompt) { if (promptEl) promptEl.focus(); return; }

  showLoading(true);

  // Simulate processing delay so the loading bar is visible
  await new Promise(r => setTimeout(r, 1400));

  try {
    const key  = matchKey(prompt);
    const data = key ? TEMPLATES[key] : generateDynamic(prompt);

    // Persist result for the result page
    sessionStorage.setItem("crud_result",  JSON.stringify(data));
    sessionStorage.setItem("crud_prompt",  prompt);

    // Navigate to result page
    window.location.href = "result.html";
  } catch (err) {
    showLoading(false);
    if (errorEl) {
      errorEl.textContent = "⚠ Something went wrong — " + err.message;
      errorEl.classList.add("visible");
    }
  }
}


/* ================================================================
   RESULT PAGE — loadResult()
   Called on DOMContentLoaded in result.html.
   Reads sessionStorage and renders all output sections.
   ================================================================ */

function loadResult() {
  const raw    = sessionStorage.getItem("crud_result");
  const prompt = sessionStorage.getItem("crud_prompt") || "";

  if (!raw) {
    // Nothing to show — redirect back to input page
    window.location.href = "index.html";
    return;
  }

  const data = JSON.parse(raw);
  renderOutput(data, prompt);
}

/** Renders all sections of the result page from a data object */
function renderOutput(data, prompt) {

  // App name + badge
  const nameEl  = document.getElementById("appName");
  const badgeEl = document.getElementById("appBadge");
  if (nameEl)  nameEl.textContent  = data.app_name || "App";
  if (badgeEl) badgeEl.textContent = "GENERATED";

  // Original prompt display
  const promptEl = document.getElementById("outputPrompt");
  if (promptEl) promptEl.textContent = "Prompt: "" + prompt + """;

  // Stats row
  const statsEl = document.getElementById("statsRow");
  if (statsEl) {
    statsEl.innerHTML = [
      { l:"Entities",    v: data.entities.length },
      { l:"Endpoints",   v: data.apis.length },
      { l:"DB Tables",   v: data.db.length },
      { l:"Suggestions", v: data.sug.length },
    ].map(s => `<div class="stat-pill"><b>${s.v}</b> ${s.l}</div>`).join("");
  }

  // Entities
  const entEl = document.getElementById("entitiesOut");
  if (entEl) {
    entEl.innerHTML = data.entities
      .map(e => `<span class="entity-tag">◈ ${esc(e)}</span>`)
      .join("");
  }

  // Database schema
  const dbEl = document.getElementById("dbOut");
  if (dbEl) {
    dbEl.innerHTML = data.db
      .map(d =>
        `<div class="db-line">
           <span class="db-table">${esc(d.t)}</span>
           <span class="db-fields">(${esc(d.f)})</span>
         </div>`
      )
      .join("");
  }

  // API endpoints
  const apiEl = document.getElementById("apisOut");
  if (apiEl) {
    apiEl.innerHTML = data.apis
      .map(a =>
        `<div class="api-row">
           <span class="method ${esc(a.m)}">${esc(a.m)}</span>
           <span class="api-path">${esc(a.p)}</span>
           <span class="api-desc">${esc(a.d)}</span>
         </div>`
      )
      .join("");
  }

  // AI Suggestions
  const sugEl = document.getElementById("suggestionsOut");
  if (sugEl) {
    sugEl.innerHTML = data.sug
      .map(s =>
        `<div class="sug-item">
           <span class="sug-arrow">→</span>${esc(s)}
         </div>`
      )
      .join("");
  }

  // Sample code
  const codeEl = document.getElementById("codeOut");
  if (codeEl) {
    codeEl.innerHTML       = highlight(data.code);
    codeEl.dataset.rawCode = data.code;
  }
}


/* ================================================================
   COPY BUTTONS
   ================================================================ */

/** Copy only the code block */
function copyCode() {
  const codeEl = document.getElementById("codeOut");
  const raw    = codeEl ? codeEl.dataset.rawCode || "" : "";
  _copyText(raw, "copyBtn", "📋 Copy");
}

/** Copy everything (entities + APIs + DB + code) as plain text */
function copyAllCode() {
  const codeEl = document.getElementById("codeOut");
  if (!codeEl) return;
  _copyText(codeEl.dataset.rawCode || "", "copyAllBtn", "📋 Copy Code");
}

function _copyText(text, btnId, resetLabel) {
  const btn = document.getElementById(btnId);
  navigator.clipboard.writeText(text)
    .then(() => {
      if (btn) { btn.textContent = "✅ Copied!"; }
      setTimeout(() => { if (btn) btn.textContent = resetLabel; }, 2000);
    })
    .catch(() => {
      // Fallback for browsers that block clipboard without HTTPS
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      if (btn) { btn.textContent = "✅ Copied!"; }
      setTimeout(() => { if (btn) btn.textContent = resetLabel; }, 2000);
    });
}


/* ================================================================
   KEYBOARD SHORTCUT
   Ctrl+Enter / Cmd+Enter on the textarea triggers generation.
   ================================================================ */
document.addEventListener("DOMContentLoaded", () => {
  const ta = document.getElementById("promptInput");
  if (ta) {
    ta.addEventListener("keydown", e => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        handleGenerate();
      }
    });
  }
});
