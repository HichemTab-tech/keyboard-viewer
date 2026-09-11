import {describe, expect, test} from "vitest"
import {keyboardConfig} from "./keyboardConfig"
import {convertVialToKeyboardConfig} from "./vialImport"

function emptyMatrix() {
    return Array.from({length: 4}, () => Array.from({length: 12}, () => "KC_NO"))
}

describe("Vial backup import", () => {
    test("resolves structured legends using the backup's Tap Dance definitions", () => {
        const baseLayer = emptyMatrix()
        baseLayer[1][4] = "TD(0)"
        baseLayer[3][5] = "LT1(KC_SPACE)"
        baseLayer[3][6] = "LT2(KC_ENTER)"

        const commandLayer = emptyMatrix()
        commandLayer[0][0] = "RCG(KC_V)"
        commandLayer[0][1] = "LGUI(KC_V)"
        commandLayer[1][1] = "LGUI(KC_C)"
        commandLayer[2][1] = "LGUI(KC_X)"

        const result = convertVialToKeyboardConfig({
            uid: 123,
            layout: [baseLayer, commandLayer],
            tap_dance: [["KC_T", "M3", "KC_NO", "KC_NO", 200]],
        }, keyboardConfig, "wip.vil")

        expect(result.layers[0].keys.L14).toMatchObject({label: "T", legend: "Hold · Macro 3"})
        expect(result.layers[0].keys.LT2).toMatchObject({label: "Space", legend: "Hold · M1"})
        expect(result.layers[0].keys.RT2).toMatchObject({label: "Enter", legend: "Hold · M2"})
        expect(result.layers[1].keys.L00).toMatchObject({
            label: "Clipboard History",
            legend: "Ctrl + GUI + V",
        })
        expect(result.layers[1].keys.L01).toMatchObject({label: "Paste", legend: "GUI + V"})
        expect(result.layers[1].keys.L11).toMatchObject({label: "Copy", legend: "GUI + C"})
        expect(result.layers[1].keys.L21).toMatchObject({label: "Cut", legend: "GUI + X"})
    })
})
