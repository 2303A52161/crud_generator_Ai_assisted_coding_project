"""
templates/fastapi_crud.py
A reusable FastAPI CRUD template.
The generator fills in {EntityName} and {resource} at runtime.

Usage (inside generator.py):
    from templates.fastapi_crud import render_fastapi_template
    code = render_fastapi_template("Student", "students")
"""

FASTAPI_CRUD_TEMPLATE = '''\
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

app = FastAPI(title="{AppName} API", version="1.0.0")

# ─── Model ─────────────────────────────────────────────────────
class {EntityName}(BaseModel):
    name: str
    description: Optional[str] = None
    created_by:  Optional[int] = None   # user_id FK

class {EntityName}Response({EntityName}):
    id:         int
    created_at: str

# ─── In-memory store ────────────────────────────────────────────
# Replace with SQLAlchemy session for a real database.
{resource}_db: List[dict] = []
_counter: int = 1

# ─── CREATE ─────────────────────────────────────────────────────
@app.post("/{resource}", response_model={EntityName}Response, status_code=201)
def create_{entity}(item: {EntityName}):
    """Create a new {entity} record."""
    global _counter
    new = {{
        "id":         _counter,
        **item.dict(),
        "created_at": datetime.utcnow().isoformat(),
    }}
    {resource}_db.append(new)
    _counter += 1
    return new

# ─── READ ALL ───────────────────────────────────────────────────
@app.get("/{resource}", response_model=List[{EntityName}Response])
def list_{resource}():
    """Return all {resource}."""
    return {resource}_db

# ─── READ ONE ───────────────────────────────────────────────────
@app.get("/{resource}/{{item_id}}", response_model={EntityName}Response)
def get_{entity}(item_id: int):
    """Return a single {entity} by ID."""
    item = next((i for i in {resource}_db if i["id"] == item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="{EntityName} not found")
    return item

# ─── UPDATE ─────────────────────────────────────────────────────
@app.put("/{resource}/{{item_id}}", response_model={EntityName}Response)
def update_{entity}(item_id: int, item: {EntityName}):
    """Replace all fields of an existing {entity}."""
    for idx, existing in enumerate({resource}_db):
        if existing["id"] == item_id:
            {resource}_db[idx] = {{
                "id":         item_id,
                **item.dict(),
                "created_at": existing["created_at"],
            }}
            return {resource}_db[idx]
    raise HTTPException(status_code=404, detail="{EntityName} not found")

# ─── DELETE ─────────────────────────────────────────────────────
@app.delete("/{resource}/{{item_id}}", status_code=204)
def delete_{entity}(item_id: int):
    """Permanently remove a {entity} by ID."""
    global {resource}_db
    before = len({resource}_db)
    {resource}_db = [i for i in {resource}_db if i["id"] != item_id]
    if len({resource}_db) == before:
        raise HTTPException(status_code=404, detail="{EntityName} not found")
'''


def render_fastapi_template(entity_name: str, resource: str) -> str:
    """
    Fill in the CRUD template with a specific entity name and resource path.

    Args:
        entity_name:  PascalCase model name, e.g. "Student"
        resource:     lowercase plural route name, e.g. "students"

    Returns:
        A complete Python source string ready to save or display.
    """
    app_name = entity_name + " Manager"
    entity   = entity_name.lower()

    return FASTAPI_CRUD_TEMPLATE.format(
        AppName    = app_name,
        EntityName = entity_name,
        entity     = entity,
        resource   = resource,
    )


# ── Quick demo ───────────────────────────────────────────────────
if __name__ == "__main__":
    print(render_fastapi_template("Product", "products"))
