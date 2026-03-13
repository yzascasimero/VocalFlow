import json
import os
import re
import sys
from pathlib import Path

PROJECT_PATTERNS = [
    re.compile(r"\b([A-Z]{2,6}[-_]\d{2,6})\b"),
    re.compile(r"\b(PROJ[-_]\d{2,6})\b", re.IGNORECASE),
    re.compile(r"\b([A-Z]{3,10}\d{2,6})\b")
]

EPISODE_PATTERNS = [
    re.compile(r"\b(?:EP|EPI|EPISODE)[-_ ]?(\d{1,4})\b", re.IGNORECASE),
    re.compile(r"\bE(\d{1,4})\b", re.IGNORECASE),
    re.compile(r"\b(\d{1,4})\b")
]

def classify_asset_type(file_path: str) -> str:
    ext = Path(file_path).suffix.lower()
    if ext in [".wav", ".mp3", ".flac", ".aac", ".m4a"]:
        return "audio"
    if ext in [".txt", ".doc", ".docx", ".pdf", ".csv", ".json"]:
        return "document"
    if ext in [".srt", ".vtt"]:
        return "subtitle"
    return ext.replace(".", "") if ext else "unknown"

def extract_project_code(text: str):
    for pattern in PROJECT_PATTERNS:
        match = pattern.search(text)
        if match:
            return match.group(1).upper().replace("_", "-")
    return None

def extract_episode_number(text: str):
    for index, pattern in enumerate(EPISODE_PATTERNS):
        match = pattern.search(text)
        if match:
            value = match.group(1)
            if index == 2 and len(value) > 4:
                continue
            return value.zfill(2)
    return None

def safe_read_text(file_path: str) -> str:
    ext = Path(file_path).suffix.lower()
    if ext not in [".txt", ".csv", ".json", ".srt", ".vtt"]:
        return ""

    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read(5000)
    except Exception:
        return ""

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing file path"}))
        sys.exit(1)

    file_path = sys.argv[1]
    file_name = os.path.basename(file_path)
    stem = Path(file_name).stem
    content_preview = safe_read_text(file_path)

    combined_text = f"{file_name} {stem} {content_preview}"

    project_code = extract_project_code(combined_text)
    episode_number = extract_episode_number(combined_text)
    asset_type = classify_asset_type(file_path)

    result = {
        "file_name": file_name,
        "project_code": project_code,
        "project_name": project_code,
        "episode_number": episode_number,
        "asset_type": asset_type,
        "matches": {
            "project_code": project_code,
            "episode_number": episode_number
        }
    }

    print(json.dumps(result))
    sys.exit(0)

if __name__ == "__main__":
    main()