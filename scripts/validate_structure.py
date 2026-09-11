#!/usr/bin/env python3
from pathlib import Path
import sys
import yaml

ROOT = Path(__file__).resolve().parents[1]
ANIMATIONS = [
    "animations/01-flying-fishes",
    "animations/02-ocean-shark",
    "animations/03-great-blue-story",
]

required_root = ["README.md", "repo.yml", "LICENSE", "index.html", "assets/css/gallery.css"]
errors = []

for rel in required_root:
    if not (ROOT / rel).is_file():
        errors.append(f"missing required file: {rel}")

for folder in ANIMATIONS:
    for filename in ("index.html", "styles.css", "script.js"):
        rel = f"{folder}/{filename}"
        if not (ROOT / rel).is_file():
            errors.append(f"missing animation file: {rel}")

if (ROOT / "repo.yml").is_file():
    with (ROOT / "repo.yml").open("r", encoding="utf-8") as handle:
        payload = yaml.safe_load(handle) or {}
    repo = payload.get("repository", {})
    integration = payload.get("integration", {})
    expected = {
        "owner": "qselmer",
        "name": "fish-byte",
        "type": "type-app",
        "status": "active",
        "stage": "experimental",
        "visibility": "public",
    }
    for key, value in expected.items():
        if repo.get(key) != value:
            errors.append(f"repo.yml: repository.{key} must be {value!r}")
    if payload.get("schema_version") != 2:
        errors.append("repo.yml: schema_version must be 2")
    type_topics = [t for t in repo.get("topics", []) if str(t).startswith("type-")]
    if type_topics != ["type-app"]:
        errors.append("repo.yml: exactly one canonical type topic, type-app, is required")
    if integration.get("profile", {}).get("include") is not False:
        errors.append("repo.yml: integration.profile.include must be false")
    website = integration.get("website", {})
    if website.get("section") != "miscellaneous":
        errors.append("repo.yml: website section must be miscellaneous")

if errors:
    print("Fish Byte validation: FAIL")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print("Fish Byte validation: PASS")
