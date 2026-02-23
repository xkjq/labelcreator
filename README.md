# Label Creator 🚀

A lightweight client-side app for composing and printing label sheets from text and images. Works entirely in the browser — no server required.

Try it out: https://xkjq.github.io/labelcreator/ 🌐

Contents
- Features
- Quick start
- Usage
- Developer notes
- Contributing
- License

Features
- Generate printable label sheets from presets or fully custom layouts (columns × rows).
- Per-label images and text with an edit modal for manual positioning.
- Custom controls for margins and label height; responsive layout keeps controls accessible.
- Label ordering modes: Sequential (interleaved), Grouped, Random.
- Optimize mode to tile a single image across a page.

## Quick start

Online
- Use it now on github pages: https://xkjq.github.io/labelcreator/

Offline (local)
1. Clone or download the repository and open the project folder.
2. Serve the folder locally (for example with Python 3 built-in server):

```bash
cd /path/to/labelcreator
python3 -m http.server 8000
```

3. Open http://localhost:8000 in your browser and open [index.html](index.html).

## Usage
- Mode: choose "Label generator" or "From Image (Optimize)".
- Layout: pick a preset or `Custom` to set columns/rows.
- Margins: choose a preset or `Custom` to enter top/right/bottom/left values.
- Label height: `Standard`, `Thin`, or `Custom (mm)`.
- Add labels with text and optional image; use the edit modal to adjust position and styles.
- Generate Sheet builds the printable page; use the browser Print dialog to print (print CSS preserves physical sizes).

## Developer notes
- Key files:
  - [index.html](index.html) — UI and markup
  - [static/css/style.css](static/css/style.css) — styles and responsive rules
  - [static/js/app.js](static/js/app.js) — application logic, presets, generation, storage, and modal editing
- Data storage: images are stored in IndexedDB; metadata is saved in `localStorage`.
- To preview changes while developing, run the local server shown above and refresh your browser.

Contributing
- Suggestions, bug reports, and pull requests are welcome. Please open an issue or a PR against the `main` branch.

## License
MIT License