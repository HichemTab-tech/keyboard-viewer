# Keyboard Viewer

Small React app for viewing and editing a split keyboard layout.

It can load the bundled sample layout, import a Vial backup or exported JSON, inspect layers and keys, then export the result again as JSON or as a preview image/PDF.

## Use

Install dependencies and start the dev server:

```bash
pnpm install
pnpm dev
```

Then open the local Vite URL in your browser.

## How to use

1. Start in edit mode to inspect layers and key assignments.
2. Import a `.vil`/Vial-style JSON backup or a previously exported layout JSON.
3. Switch to preview mode to see the final layout.
4. Export the current layout as JSON, PNG, or print it to PDF.
