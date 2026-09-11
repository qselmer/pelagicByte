# pelagicByte - Marine Creative Coding

**pelagicByte** is a small collection of marine-themed creative coding experiments and web animations built with HTML, CSS, and JavaScript.

This repository is a personal creative laboratory rather than a scientific research output, software package, or production application. It is intentionally excluded from the main academic GitHub profile and can instead be surfaced on the academic website under **Miscellaneous → Creative coding**.

## Gallery

| Piece | Description | Source |
|---|---|---|
| Flying Fishes | Canvas-based flying-fish and water-surface animation. | [`animations/01-flying-fishes/`](animations/01-flying-fishes/) |
| Ocean Shark | CSS/JavaScript shark scene with animated bubbles. | [`animations/02-ocean-shark/`](animations/02-ocean-shark/) |
| El Secreto del Gran Azul | Illustrated marine story with an animated sea turtle and ocean scene. | [`animations/03-great-blue-story/`](animations/03-great-blue-story/) |

Open [`index.html`](index.html) for the repository gallery. For local browsing, you can also run:

```bash
python -m http.server 8000
```

and visit `http://localhost:8000/`.

## Repository structure

```text
.
├── animations/
│   ├── 01-flying-fishes/
│   ├── 02-ocean-shark/
│   └── 03-great-blue-story/
├── assets/
│   └── css/
│       └── gallery.css
├── scripts/
│   └── validate_structure.py
├── .github/workflows/
│   ├── validate.yml
│   └── delete-merged-pr-branches.yml
├── index.html
├── repo.yml
├── LICENSE
└── README.md
```

Each animation remains self-contained with its own `index.html`, `styles.css`, and `script.js`.

## Portfolio integration

The repository uses `type-app` only as the closest machine-readable repository class in the controlled taxonomy. It is **not** presented in the academic profile's Apps & dashboards section because `integration.profile.include` is set to `false` in `repo.yml`.

Its intended public placement is **Miscellaneous → Creative coding**.

## Attribution and reuse

Source-specific attribution comments should be retained when adapting individual pieces. In particular, the turtle experiment contains an inspiration reference in its source files.

The repository code is released under the [MIT License](LICENSE). External libraries, references, or third-party assets retain their own terms.
