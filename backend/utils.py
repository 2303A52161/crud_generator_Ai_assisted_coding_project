"""
utils.py — Shared helper / utility functions used across the backend.
"""

import re
from typing import List


def slugify(text: str) -> str:
    """
    Convert a string into a URL-safe slug.
    Example: "Student Management System" → "student-management-system"
    """
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text


def extract_entity_name(prompt: str) -> str:
    """
    Pull the most meaningful noun from a user prompt to use as
    the primary entity name.

    Strategy:
      1. Strip common stop words.
      2. Return the first remaining word, title-cased.
      3. Fall back to 'Item' if nothing is left.
    """
    STOP_WORDS = {
        "create", "build", "make", "develop", "design", "a", "an", "the",
        "system", "app", "application", "management", "platform", "with",
        "and", "for", "my", "our", "simple", "basic", "web", "full", "new",
        "using", "that", "has", "have", "where", "which",
    }

    words = re.sub(r"[^a-zA-Z\s]", "", prompt).split()
    filtered = [w for w in words if w.lower() not in STOP_WORDS and len(w) > 2]

    if not filtered:
        return "Item"

    raw = filtered[0]
    return raw[0].upper() + raw[1:].lower()


def infer_app_name(prompt: str) -> str:
    """
    Generate a friendly app name from the prompt.
    Example: "build inventory tracker" → "Inventory Tracker App"
    """
    STOP_WORDS = {
        "create", "build", "make", "develop", "design", "a", "an", "the",
        "system", "app", "application", "management", "platform", "with",
        "and", "for", "my", "our", "simple", "basic", "web", "full", "new",
    }

    words = re.sub(r"[^a-zA-Z\s]", "", prompt).split()
    filtered = [w[0].upper() + w[1:].lower()
                for w in words if w.lower() not in STOP_WORDS and len(w) > 2]

    name_words = filtered[:3]
    return " ".join(name_words) + " App" if name_words else "Generated App"


def format_code_block(code: str, language: str = "python") -> str:
    """
    Wrap raw code in a Markdown fenced code block.
    Useful when returning code snippets as part of a text response.
    """
    return f"```{language}\n{code.strip()}\n```"


def validate_prompt(prompt: str) -> List[str]:
    """
    Return a list of validation error messages for a given prompt.
    An empty list means the prompt is valid.
    """
    errors: List[str] = []

    if not prompt or not prompt.strip():
        errors.append("Prompt must not be empty.")
        return errors

    if len(prompt.strip()) < 5:
        errors.append("Prompt is too short. Please describe your app in more detail.")

    if len(prompt) > 1000:
        errors.append("Prompt is too long. Please keep it under 1000 characters.")

    return errors
