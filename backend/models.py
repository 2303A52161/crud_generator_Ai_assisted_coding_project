"""
models.py — Pydantic data models
Defines the shape of the request body and the structured response
returned by the /api/generate endpoint.
"""

from pydantic import BaseModel
from typing import List


class GenerateRequest(BaseModel):
    """Request body for POST /api/generate"""
    prompt: str

    class Config:
        json_schema_extra = {
            "example": {
                "prompt": "Build a student management system with grades"
            }
        }


class APIEndpoint(BaseModel):
    """A single REST API endpoint entry"""
    method: str       # GET | POST | PUT | DELETE | PATCH
    path:   str       # e.g. /students/{id}
    desc:   str       # short description


class DBTable(BaseModel):
    """A single database table definition"""
    table:  str       # table name
    fields: str       # comma-separated field definitions


class GenerateResponse(BaseModel):
    """Full structured response returned by the generator"""
    app_name:    str
    entities:    List[str]
    apis:        List[APIEndpoint]
    database:    List[DBTable]
    suggestions: List[str]
    sample_code: str

    class Config:
        json_schema_extra = {
            "example": {
                "app_name":    "Todo App",
                "entities":    ["Task", "User", "Category"],
                "apis": [
                    {"method": "GET",    "path": "/tasks",       "desc": "List all tasks"},
                    {"method": "POST",   "path": "/tasks",       "desc": "Create a task"},
                    {"method": "PUT",    "path": "/tasks/{id}",  "desc": "Update a task"},
                    {"method": "DELETE", "path": "/tasks/{id}",  "desc": "Delete a task"},
                ],
                "database": [
                    {"table": "Tasks",  "fields": "id INT PK, title VARCHAR, status ENUM"},
                    {"table": "Users",  "fields": "id INT PK, name VARCHAR, email VARCHAR"},
                ],
                "suggestions": [
                    "Add due-date reminders",
                    "Implement priority levels",
                ],
                "sample_code": "# FastAPI route code here..."
            }
        }
