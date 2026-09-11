# Responsive Vial Legends Design

## Goal

Turn imported Vial layouts into a clean, readable keyboard reference whose browser preview, PNG export, and print output do not overlap at supported desktop widths.

## Current failures

- The preview grid defines two columns below 2600px while the macro section spans three from the 2xl breakpoint, creating an implicit third column.
- `KeyboardView` enlarges its fixed 760px canvas by 1.06 regardless of the card width.
- Key labels are single unstructured strings. Long firmware expressions render beyond the keycap.
- The importer only recognizes a small set of regular-expression wrappers and does not resolve layer-tap or Tap Dance definitions.
- The repository has no automated tests and one pre-existing lint failure in an unused UI helper.

## Architecture

`keySemantics.ts` owns parsing and presentation of QMK/Vial values. It returns `KeyboardAction` objects with a concise primary `label`, an optional secondary `legend`, an accurate description, and source metadata where useful. `vialImport.ts` remains responsible for matrix-to-layout conversion and supplies Tap Dance definitions to the semantic parser.

`KeyboardView` and `KeyLegend` move into focused components. A measured wrapper scales the fixed keyboard coordinate system to its own available width, never above its requested maximum scale. Preview layout uses one coherent responsive grid; child content cannot create implicit tracks or horizontal overflow.

## Legend rules

- Preserve the existing AZERTY base, Shift, and AltGr symbol maps.
- `LT1(KC_SPACE)` renders primary `Space` and secondary `Hold · M1`; the equivalent standard `LT(1, KC_SPACE)` form behaves identically.
- Known user-requested GUI chords render semantic commands: `LGUI(KC_C)` as `Copy`, `LGUI(KC_V)` as `Paste`, and `LGUI(KC_X)` as `Cut`. The secondary legend retains `GUI + C/V/X`.
- Other modifier wrappers render a compact chord rather than raw syntax.
- `TD(n)` is resolved against Vial's `[tap, hold, double tap, tap-hold, term]` entry. The primary legend is the tap action and the secondary legend summarizes the first meaningful alternate action.
- Transparent and disabled keys remain visually distinct. Unknown values receive a humanized fallback and retain their exact source in the description.

## Layout and visual design

- Keep the existing dark, understated visual direction while improving contrast, spacing, typography, and hierarchy.
- Use the keyboard's existing absolute coordinate geometry, but derive scale from the rendered container using `ResizeObserver`.
- Use two preview columns only when each column can keep legends readable; use one column at narrower widths and three only on genuinely wide displays.
- Layer cards have equal internal structure, clipped overflow, consistent captions, and no content-driven grid tracks.
- Key legends support two centered lines. Primary actions are prominent; secondary tap/hold/chord details are smaller and muted.
- PNG export captures the same deterministic preview surface shown in the browser. Print uses one full-width layer per row.

## Error handling

- Invalid JSON and malformed Vial matrices retain the current user-visible import errors.
- Unknown keycodes never abort an import; they use a safe readable fallback.
- Missing Tap Dance entries render `Tap Dance n` and retain the slot number.
- PNG export failures produce a visible status message rather than an unhandled rejection.

## Testing and acceptance criteria

- Unit tests cover the exact problematic values from `wip.vil`, nested modifiers, aliases, unknown values, and Tap Dance resolution.
- An import-level test proves the matrix produces `Space / Hold · M1`, `Enter / Hold · M2`, Paste, Copy, Cut, and the configured Tap Dance legend.
- Playwright imports the supplied layout shape and checks 1280, 2048, and 2560px previews.
- At each tested width, document and layer-card horizontal overflow are zero and every keyboard bounding box stays within its card.
- Final screenshots are inspected in edit mode and sidebar-hidden preview mode.
- TypeScript build, production bundle, unit tests, browser tests, and ESLint pass.

## Scope

This work does not attempt to implement every QMK custom keycode or redesign the keyboard geometry editor. It provides a composable parser, strong fallbacks, and complete handling for the supplied `wip.vil` example.
