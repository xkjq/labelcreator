# Label Creator

A small client-side app for composing and printing label sheets from text and images.

Features
- Generate printable label sheets using preset or custom layouts (columns × rows).
- Custom margins and label heights, with inline controls that appear to the right when space allows.
- Per-label images and text, manual positioning via the edit modal.
- Ordering modes: Sequential (interleaved), Grouped, and Random.
- An "Optimize" mode to tile a single image across a page.

Quick start

1. Open the project folder and start a simple static server (Python 3):

```bash
cd /path/to/labelcreator
python3 -m http.server 8000
```

2. Open your browser at http://localhost:8000 and load `index.html`.

How to use
- Select "Label generator" mode and choose a preset layout or `Custom` to show inline custom controls.
- Add labels using the input and optional image upload, edit labels to position images/text.
- Choose the label ordering mode before clicking "Generate Sheet".
- Use "Print" to print the generated sheet (print CSS preserves physical sizes).

Files
- `index.html` — main UI and markup.
- `static/css/style.css` — styles and responsive layout rules.
- `static/js/app.js` — app logic: presets, generation, storage, and modal editing.

Development notes
- The app stores images in IndexedDB and metadata in `localStorage`.
- To preview changes quickly, run the static server above and refresh the browser.

If you'd like, I can add a small preview screenshot, enhance the development workflow, or wire up automated tests.