#!/usr/bin/env python3
from pathlib import Path
import re
import sys

import yaml

ROOT = Path(__file__).resolve().parents[1]
ANIMATIONS_ROOT = ROOT / "animations"
NAME_PATTERN = re.compile(r"^\d{2,}-[a-z0-9]+(?:-[a-z0-9]+)*$")

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

# Discover every animation dynamically. There is intentionally no fixed inventory.
animation_dirs = []
if not ANIMATIONS_ROOT.is_dir():
    errors.append("missing animations directory")
else:
    animation_dirs = sorted(
        (path for path in ANIMATIONS_ROOT.iterdir() if path.is_dir()),
        key=lambda path: path.name,
    )
    if not animation_dirs:
        errors.append("animations directory must contain at least one animation")

prefixes = {}
for animation_dir in animation_dirs:
    folder = f"animations/{animation_dir.name}"

    if not NAME_PATTERN.fullmatch(animation_dir.name):
        errors.append(
            f"animation directory is not numbered kebab-case: {folder}; "
            "expected NN-name or NNN-name"
        )
    else:
        prefix = int(animation_dir.name.split("-", 1)[0])
        if prefix in prefixes:
            errors.append(
                f"duplicate animation number {prefix}: {prefixes[prefix]} and {folder}"
            )
        prefixes[prefix] = folder

    index_path = animation_dir / "index.html"
    if not index_path.is_file():
        errors.append(f"missing animation entry point: {folder}/index.html")
        continue

    index_text = index_path.read_text(encoding="utf-8")
    index_lower = index_text.lower()

    # Each animation must be directly runnable as a standalone HTML page.
    if "<html" not in index_lower or "<body" not in index_lower:
        errors.append(f"{folder}/index.html must be standalone HTML with <html> and <body>")

    styles_path = animation_dir / "styles.css"
    if styles_path.is_file() and 'href="styles.css"' not in index_text and "href='styles.css'" not in index_text:
        errors.append(f"{folder}/index.html must load styles.css when that file exists")

    script_path = animation_dir / "script.js"
    if script_path.is_file():
        if 'src="script.js"' not in index_text and "src='script.js'" not in index_text:
            errors.append(f"{folder}/index.html must load script.js when that file exists")

        script_text = script_path.read_text(encoding="utf-8")
        uses_jquery = "$(" in script_text or "jquery(" in script_text.lower()
        if uses_jquery and "jquery" not in index_lower:
            errors.append(f"{folder}/index.html must load jQuery because script.js uses it")

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

# The root gallery is curated: it does not need a card for every animation.
# It must, however, never contain links to animation directories that do not exist.
root_index = ROOT / "index.html"
if root_index.is_file():
    root_index_text = root_index.read_text(encoding="utf-8")
    linked_animation_dirs = re.findall(
        r'href=["\'](animations/[^"\']+)/?["\']', root_index_text
    )
    for linked in linked_animation_dirs:
        target = ROOT / linked.rstrip("/")
        if not target.is_dir():
            errors.append(f"index.html links to missing animation directory: {linked}")

for rel in ("README.md", "index.html", "repo.yml", "animations/README.md"):
    path = ROOT / rel
    if path.is_file() and "—" in path.read_text(encoding="utf-8"):
        errors.append(f"{rel} contains an em dash; use a short hyphen for repository branding")

if errors:
    print("pelagicByte validation: FAIL")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print(f"pelagicByte validation: PASS ({len(animation_dirs)} animations validated)")
