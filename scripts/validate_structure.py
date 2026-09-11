#!/usr/bin/env python3
from pathlib import Path
import re
import sys

import yaml

ROOT = Path(__file__).resolve().parents[1]
ANIMATIONS = [
    "animations/01-flying-fishes",
    "animations/02-ocean-shark",
    "animations/03-swimming-turtle",
    "animations/04-marine-dynamic",
]
JQUERY_REQUIRED = {
    "animations/01-flying-fishes",
    "animations/04-marine-dynamic",
}

required_root = [
    "README.md",
    "repo.yml",
    "LICENSE",
    "index.html",
    "animations/README.md",
    "assets/css/gallery.css",
]
errors = []

for rel in required_root:
    if not (ROOT / rel).is_file():
        errors.append(f"missing required file: {rel}")

animations_root = ROOT / "animations"
if animations_root.is_dir():
    actual_dirs = sorted(
        f"animations/{path.name}"
        for path in animations_root.iterdir()
        if path.is_dir()
    )
    if actual_dirs != ANIMATIONS:
        errors.append(
            "animation directories must match the curated gallery: "
            + ", ".join(ANIMATIONS)
        )

name_pattern = re.compile(r"^\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$")
for folder in ANIMATIONS:
    animation_dir = ROOT / folder
    if not animation_dir.is_dir():
        errors.append(f"missing animation directory: {folder}")
        continue

    if not name_pattern.fullmatch(animation_dir.name):
        errors.append(f"animation directory is not numbered kebab-case: {folder}")

    for filename in ("index.html", "styles.css", "script.js"):
        rel = f"{folder}/{filename}"
        if not (ROOT / rel).is_file():
            errors.append(f"missing animation file: {rel}")

    index_path = animation_dir / "index.html"
    if index_path.is_file():
        index_text = index_path.read_text(encoding="utf-8")
        if 'href="styles.css"' not in index_text:
            errors.append(f"{folder}/index.html must load styles.css")
        if 'src="script.js"' not in index_text:
            errors.append(f"{folder}/index.html must load script.js")
        if folder in JQUERY_REQUIRED and "jquery" not in index_text.lower():
            errors.append(f"{folder}/index.html must load jQuery")

repo_yml = ROOT / "repo.yml"
if repo_yml.is_file():
    with repo_yml.open("r", encoding="utf-8") as handle:
        payload = yaml.safe_load(handle) or {}

    repo = payload.get("repository", {})
    integration = payload.get("integration", {})
    expected = {
        "owner": "qselmer",
        "name": "pelagicByte",
        "title": "pelagicByte - Marine Creative Coding",
        "type": "type-app",
        "status": "active",
        "stage": "experimental",
        "visibility": "public",
        "description": "Marine-themed creative coding experiments and web animations built with HTML, CSS, and JavaScript.\n",
    }
    for key, value in expected.items():
        if repo.get(key) != value:
            errors.append(f"repo.yml: repository.{key} must be {value!r}")

    if payload.get("schema_version") != 2:
        errors.append("repo.yml: schema_version must be 2")

    expected_topics = [
        "type-app",
        "creative-coding",
        "marine-animation",
        "javascript",
    ]
    if repo.get("topics") != expected_topics:
        errors.append("repo.yml: topics must match the canonical pelagicByte topic list")

    type_topics = [t for t in repo.get("topics", []) if str(t).startswith("type-")]
    if type_topics != ["type-app"]:
        errors.append("repo.yml: exactly one canonical type topic, type-app, is required")

    if integration.get("profile", {}).get("include") is not False:
        errors.append("repo.yml: integration.profile.include must be false")

    website = integration.get("website", {})
    if website.get("include") is not True:
        errors.append("repo.yml: integration.website.include must be true")
    if website.get("section") != "miscellaneous":
        errors.append("repo.yml: website section must be miscellaneous")
    if website.get("label") != "Creative coding":
        errors.append("repo.yml: website label must be Creative coding")

    expected_url = "https://github.com/qselmer/pelagicByte"
    if integration.get("repository_url") != expected_url:
        errors.append(f"repo.yml: integration.repository_url must be {expected_url}")

root_index = ROOT / "index.html"
if root_index.is_file():
    root_index_text = root_index.read_text(encoding="utf-8")
    for folder in ANIMATIONS:
        href = f'{folder}/'
        if href not in root_index_text:
            errors.append(f"index.html must link to {href}")

for rel in ("README.md", "index.html", "repo.yml", "animations/README.md"):
    path = ROOT / rel
    if path.is_file() and "—" in path.read_text(encoding="utf-8"):
        errors.append(f"{rel} contains an em dash; use a short hyphen for repository branding")

if errors:
    print("pelagicByte validation: FAIL")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print("pelagicByte validation: PASS")
