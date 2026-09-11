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

- [ ] Add Vitest and Playwright scripts and development dependencies.
- [ ] Write failing tests for `LT1(KC_SPACE)`, `LT2(KC_ENTER)`, `LGUI(KC_V/C/X)`, modifier fallbacks, common aliases, and transparent/disabled values.
- [ ] Run the semantic test and confirm failures come from the missing module/API.
- [ ] Implement the smallest recursive parser and display maps that satisfy the tests.
- [ ] Run the semantic test and full unit suite.

### Task 2: Context-aware Vial import

**Files:**
- Modify: `src/vialImport.ts`
- Modify: `src/keyboardConfig.ts`
- Create: `src/vialImport.test.ts`

**Interfaces:**
- Consumes: `actionFromVialValue` and `VialActionContext`
- Produces: imported actions with `label`, optional `legend`, and descriptive metadata

- [ ] Write a failing import test with the supplied layout's representative matrix and Tap Dance slot.
- [ ] Confirm layer-tap and Tap Dance assertions fail against the current importer.
- [ ] Route every imported value through `keySemantics.ts` with the parsed Tap Dance context.
- [ ] Extend action metadata only as required for accurate legends and inspection.
- [ ] Run importer and semantic tests together.

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

- [ ] Write a browser test that imports a Vial fixture and asserts document/card/keyboard overflow invariants.
- [ ] Run it at 2048px and confirm the current implicit column and fixed-width keyboard failures.
- [ ] Extract key rendering and add semantic two-line legends.
- [ ] Add a `ResizeObserver`-driven fit scale and remove the hard-coded 1.06 enlargement.
- [ ] Replace conflicting preview spans/breakpoints with one coherent grid.
- [ ] Run browser checks at 1280, 2048, and 2560px.

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

- [ ] Add a failing browser assertion for the final page hierarchy and meaningful-layer preview behavior.
- [ ] Refine page, card, toolbar, sidebar, caption, keycap, and print styles.
- [ ] Catch PNG export errors and show a useful status.
- [ ] Remove template metadata and resolve the existing lint failure without suppressing the rule globally.
- [ ] Capture and inspect screenshots made from the full supplied `wip.vil` in edit and preview modes.

### Task 5: Final verification

**Files:**
- Modify: `README.md` only if commands changed during implementation

**Interfaces:**
- Consumes: all preceding tasks
- Produces: a verified feature branch ready for review

- [ ] Run unit tests.
- [ ] Run Playwright tests.
- [ ] Run ESLint and TypeScript checks.
- [ ] Build the production bundle.
- [ ] Re-import `/home/hichemtab/Downloads/wip.vil`, inspect final screenshots, and confirm all named legends.
- [ ] Review the diff for unrelated changes and update the implementation checklist.
