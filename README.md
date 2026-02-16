# Label Creator — Browser-only

This is a small static web app that runs entirely in the browser to generate printable label sheets. No server or dependencies required.

Usage

1. Open `index.html` in a modern browser (double-click the file or use a local static server).

2. Select a layout, add labels (text and/or images), press `Generate Sheet`, then `Print`.

Notes

- Images are handled in-memory (Data URLs) and are not uploaded to any server.
- For best printing results, use Chrome or Firefox print preview and set page size/margins to match your labels.

Printing tips

- Set the browser print scale to 100% (no "fit to page") so mm sizes are preserved.
- In Chrome/Edge print dialog, uncheck "Headers and footers" and enable "Background graphics" for best fidelity.
- Use the `Page size` and `Margins` controls in the UI to match your label sheet; the app computes exact label sizes in mm.
