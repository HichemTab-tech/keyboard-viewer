# Responsive Vial Legends Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render the supplied Vial layout with semantic two-line key legends and responsive, non-overlapping preview cards.

**Architecture:** A pure semantic parser converts raw Vial/QMK values into display-ready `KeyboardAction` objects. Focused keyboard components consume those actions, while a measured wrapper scales the fixed layout coordinate space to each card.

**Tech Stack:** React 19, TypeScript 5.9, Tailwind CSS 4, Vite 7, Vitest, Playwright

**Spec:** `docs/superpowers/specs/2026-09-11-responsive-vial-legends-design.md`

## Global Constraints

- Preserve AZERTY output mapping.
- Friendly labels must retain the exact firmware action in a secondary legend or description.
- Unknown keycodes must never abort import.
- No horizontal overflow at 1280, 2048, or 2560px.
- Verify changes against `/home/hichemtab/Downloads/wip.vil`.

---

### Task 1: Test harness and semantic API

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `src/keySemantics.test.ts`
- Create: `src/keySemantics.ts`

**Interfaces:**
- Produces: `actionFromVialValue(value: unknown, context?: VialActionContext): KeyboardAction | null`
- Produces: `VialActionContext` with optional Tap Dance definitions

- [x] Add Vitest and Playwright scripts and development dependencies.
- [x] Write failing tests for `LT1(KC_SPACE)`, `LT2(KC_ENTER)`, `LGUI(KC_V/C/X)`, modifier fallbacks, common aliases, and transparent/disabled values.
- [x] Run the semantic test and confirm failures come from the missing module/API.
- [x] Implement the smallest recursive parser and display maps that satisfy the tests.
- [x] Run the semantic test and full unit suite.

### Task 2: Context-aware Vial import

**Files:**
- Modify: `src/vialImport.ts`
- Modify: `src/keyboardConfig.ts`
- Create: `src/vialImport.test.ts`

**Interfaces:**
- Consumes: `actionFromVialValue` and `VialActionContext`
- Produces: imported actions with `label`, optional `legend`, and descriptive metadata

- [x] Write a failing import test with the supplied layout's representative matrix and Tap Dance slot.
- [x] Confirm layer-tap and Tap Dance assertions fail against the current importer.
- [x] Route every imported value through `keySemantics.ts` with the parsed Tap Dance context.
- [x] Extend action metadata only as required for accurate legends and inspection.
- [x] Run importer and semantic tests together.

### Task 3: Responsive keyboard components

**Files:**
- Create: `src/components/KeyLegend.tsx`
- Create: `src/components/KeyboardView.tsx`
- Create: `e2e/preview.spec.ts`
- Create: `playwright.config.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `KeyboardConfiguration`, `KeyboardLayer`, `KeyboardAction`
- Produces: a responsive keyboard canvas bounded by its parent width

- [x] Write a browser test that imports a Vial fixture and asserts document/card/keyboard overflow invariants.
- [x] Run it at 2048px and confirm the current implicit column and fixed-width keyboard failures.
- [x] Extract key rendering and add semantic two-line legends.
- [x] Add a `ResizeObserver`-driven fit scale and remove the hard-coded 1.06 enlargement.
- [x] Replace conflicting preview spans/breakpoints with one coherent grid.
- [x] Run browser checks at 1280, 2048, and 2560px.

### Task 4: Visual and export polish

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/index.css`
- Modify: `index.html`
- Modify: `README.md`
- Modify or remove: `src/components/ui/button.tsx`

**Interfaces:**
- Consumes: responsive keyboard components
- Produces: consistent edit, preview, PNG, and print surfaces

- [x] Add a failing browser assertion for the final page hierarchy and meaningful-layer preview behavior.
- [x] Refine page, card, toolbar, sidebar, caption, keycap, and print styles.
- [x] Catch PNG export errors and show a useful status.
- [x] Remove template metadata and resolve the existing lint failure without suppressing the rule globally.
- [x] Capture and inspect screenshots made from the full supplied `wip.vil` in edit and preview modes.

### Task 5: Final verification

**Files:**
- Modify: `README.md` only if commands changed during implementation

**Interfaces:**
- Consumes: all preceding tasks
- Produces: a verified feature branch ready for review

- [x] Run unit tests.
- [x] Run Playwright tests.
- [x] Run ESLint and TypeScript checks.
- [x] Build the production bundle.
- [x] Re-import `/home/hichemtab/Downloads/wip.vil`, inspect final screenshots, and confirm all named legends.
- [x] Review the diff for unrelated changes and update the implementation checklist.
