# Animations

`pelagicByte` treats `animations/` as an open-ended collection. The validator discovers animation directories automatically, so there is no fixed maximum and no central list to update when a new piece is added.

## Directory contract

Create each animation in its own numbered kebab-case directory:

```text
animations/
├── 01-flying-fishes/
├── 02-ocean-shark/
├── 03-swimming-turtle/
├── 04-marine-dynamic/
├── 05-polygonal-octopus/
└── NN-new-animation/
```

Each animation must contain a standalone `index.html` with `<html>` and `<body>` so it can run independently. `styles.css` and `script.js` are optional; when either file exists, `index.html` must load it. If `script.js` uses jQuery, the page must load jQuery explicitly.

The directory number must be unique. Two or more digits are accepted, so the convention continues beyond `99` without changing the validator.

Source-specific attribution comments should be preserved where applicable.
