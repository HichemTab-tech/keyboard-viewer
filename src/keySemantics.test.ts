import {describe, expect, test} from "vitest"
import {actionFromVialValue} from "./keySemantics"

describe("Vial key semantics", () => {
    test.each([
        ["LT1(KC_SPACE)", "Space", "Hold · M1", "m1"],
        ["LT2(KC_ENTER)", "Enter", "Hold · M2", "m2"],
        ["LT(3, KC_TAB)", "Tab", "Hold · M3", "m3"],
    ])("shows the tapped key and held layer for %s", (raw, label, legend, targetLayerId) => {
        expect(actionFromVialValue(raw)).toMatchObject({
            type: "holdTap",
            label,
            legend,
            metadata: {source: raw, targetLayerId},
        })
    })

    test.each([
        ["LGUI(KC_C)", "Copy", "GUI + C"],
        ["LGUI(KC_V)", "Paste", "GUI + V"],
        ["LGUI(KC_X)", "Cut", "GUI + X"],
    ])("uses semantic names without hiding the chord for %s", (raw, label, legend) => {
        expect(actionFromVialValue(raw)).toMatchObject({label, legend, metadata: {source: raw}})
    })

    test.each([
        ["LGUI(KC_1)", "Desktop 1", "GUI + 1"],
        ["LGUI(KC_5)", "Desktop 5", "GUI + 5"],
        ["LGUI(KC_0)", "Desktop 10", "GUI + 0"],
    ])("names GUI number shortcuts by desktop for %s", (raw, label, legend) => {
        expect(actionFromVialValue(raw)).toMatchObject({label, legend, metadata: {source: raw}})
    })

    test.each(["RCG(KC_V)", "LCG(KC_V)"])("names %s as clipboard history without hiding its chord", (raw) => {
        expect(actionFromVialValue(raw)).toMatchObject({
            label: "Clipboard History",
            legend: "Ctrl + GUI + V",
            metadata: {source: raw},
        })
    })

    test.each([
        ["LSFT(KC_M)", "?"],
        ["RALT(KC_7)", "`"],
    ])("renders modifier expression %s compactly", (raw, label) => {
        expect(actionFromVialValue(raw)).toMatchObject({label, metadata: {source: raw}})
    })

    test.each([
        ["KC_PGDOWN", "PgDn"],
        ["KC_KP_PLUS", "+"],
        ["KC_WH_U", "Wheel ↑"],
        ["KC_MPLY", "Play / Pause"],
        ["KC_BRID", "Brightness −"],
        ["KC_LNUM", "Num Lock"],
        ["QK_CAPS_WORD_TOGGLE", "Caps Word"],
    ])("humanizes common keycode %s", (raw, label) => {
        expect(actionFromVialValue(raw)).toMatchObject({label})
    })

    test("distinguishes transparent and disabled keys", () => {
        expect(actionFromVialValue("KC_TRNS")).toMatchObject({type: "special", value: "transparent", label: ""})
        expect(actionFromVialValue("KC_NO")).toMatchObject({type: "special", value: "no", label: ""})
        expect(actionFromVialValue(-1)).toBeNull()
    })

    test("falls back safely for an unknown keycode", () => {
        expect(actionFromVialValue("QK_SOMETHING_NEW")).toMatchObject({
            label: "Something New",
            metadata: {source: "QK_SOMETHING_NEW"},
        })
    })

    test("resolves a configured Tap Dance into its tap and hold actions", () => {
        expect(actionFromVialValue("TD(0)", {
            tapDance: [["KC_T", "M3", "KC_NO", "KC_NO", 200]],
        })).toMatchObject({
            type: "tapDance",
            label: "T",
            legend: "Hold · Macro 3",
            metadata: {source: "TD(0)", slot: 0, tappingTerm: 200},
        })
    })
})
