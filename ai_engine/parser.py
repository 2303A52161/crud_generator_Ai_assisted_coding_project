"""
parser.py
Converts the raw string returned by the AI API into a validated
Python dict that matches the GenerateResponse schema in models.py.

Responsibilities:
  1. Strip any accidental markdown fences the model may have added.
  2. Parse JSON.
  3. Validate required keys are present.
  4. Normalise / fill in sensible defaults for missing optional fields.
"""

import json
import re
from typing import Any, Dict


# ── Required top-level keys ──────────────────────────────────────
REQUIRED_KEYS = {"app_name", "entities", "apis", "database", "suggestions", "sample_code"}


class ParseError(Exception):
    """Raised when the AI output cannot be parsed into a valid structure."""
    pass


def strip_fences(raw: str) -> str:
    """
    Remove Markdown code fences that the model sometimes wraps around JSON.
    e.g.  ```json\n{...}\n```  →  {...}
    """
    # Remove ```json ... ``` or ``` ... ```
    raw = re.sub(r"^```(?:json)?\s*", "", raw.strip(), flags=re.IGNORECASE)
    raw = re.sub(r"\s*```$", "", raw.strip())
    return raw.strip()


def parse_ai_output(raw: str) -> Dict[str, Any]:
    """
    Parse the raw AI response string into a validated dict.

    Args:
        raw: The raw text content returned by the AI model.

    Returns:
        A dict with keys: app_name, entities, apis, database,
        suggestions, sample_code.

    Raises:
        ParseError: If the output cannot be parsed or is missing required keys.
    """
    cleaned = strip_fences(raw)

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise ParseError(f"AI returned invalid JSON: {exc}") from exc

    # ── Validate required keys ───────────────────────────────────
    missing = REQUIRED_KEYS - set(data.keys())
    if missing:
        raise ParseError(f"AI response is missing keys: {', '.join(missing)}")

    # ── Normalise apis list ──────────────────────────────────────
    # Accept both {"method","path","desc"} and {"method","path","description"}
    normalised_apis = []
    for entry in data.get("apis", []):
        normalised_apis.append({
            "method": entry.get("method", "GET").upper(),
            "path":   entry.get("path", "/unknown"),
            "desc":   entry.get("desc") or entry.get("description", ""),
        })
    data["apis"] = normalised_apis

    # ── Normalise database list ──────────────────────────────────
    # Accept {"table","fields"} or {"name","schema"} etc.
    normalised_db = []
    for entry in data.get("database", []):
        normalised_db.append({
            "table":  entry.get("table") or entry.get("name", "Unknown"),
            "fields": entry.get("fields") or entry.get("schema", "id INT PK"),
        })
    data["database"] = normalised_db

    # ── Ensure lists are lists ───────────────────────────────────
    for key in ("entities", "suggestions"):
        if not isinstance(data[key], list):
            data[key] = [str(data[key])]

    # ── Ensure sample_code is a string ──────────────────────────
    if not isinstance(data["sample_code"], str):
        data["sample_code"] = str(data["sample_code"])

    return data
