// noinspection SpellCheckingInspection

import type {KeyboardAction, KeyboardConfiguration, KeyboardLayer, KeyboardMacro, LayoutKey} from "./keyboardConfig"

type UnknownRecord = Record<string, unknown>

type VialBackup = {
    version?: number
    uid?: number | string
    layout?: unknown
    macro?: unknown
    combo?: unknown
}

const matrixToKeyId: Array<Array<string | null>> = [
    ["L00", "L01", "L02", "L03", "L04", "L05", "R06", "R05", "R04", "R03", "R02", "R01"],
    ["L10", "L11", "L12", "L13", "L14", "L15", "R16", "R15", "R14", "R13", "R12", "R11"],
    ["L20", "L21", "L22", "L23", "L24", "L25", null, "R25", "R24", "R23", "R22", "R21"],
    ["L06", "L16", null, "LT0", "LT1", "LT2", "RT2", "RT1", "RT0", "R00", "R10", "R20"],
]

const azertyBaseMap: Record<string, string> = {
    KC_TAB: "Tab",
    KC_ESC: "Esc",
    KC_ESCAPE: "Esc",
    KC_ENTER: "Enter",
    KC_ENT: "Enter",
    KC_BSPACE: "Bksp",
    KC_BSPC: "Bksp",
    KC_DEL: "Del",
    KC_DELETE: "Del",
    KC_PSCR: "PrtSc",
    KC_PSCREEN: "PrtSc",
    KC_SPACE: "Space",
    KC_SPC: "Space",
    KC_LCTRL: "Ctrl",
    KC_RCTRL: "Ctrl",
    KC_LSHIFT: "Shift",
    KC_RSHIFT: "Shift",
    KC_LALT: "Alt",
    KC_RALT: "AltGr",
    KC_LGUI: "GUI",
    KC_RGUI: "GUI",
    KC_CAPSLOCK: "Caps",
    KC_HOME: "Home",
    KC_END: "End",
    KC_UP: "Up",
    KC_DOWN: "Down",
    KC_LEFT: "Left",
    KC_RIGHT: "Right",
    KC_PGUP: "PgUp",
    KC_PGDN: "PgDn",
    KC_A: "Q",
    KC_B: "B",
    KC_C: "C",
    KC_D: "D",
    KC_E: "E",
    KC_F: "F",
    KC_G: "G",
    KC_H: "H",
    KC_I: "I",
    KC_J: "J",
    KC_K: "K",
    KC_L: "L",
    KC_M: ",",
    KC_N: "N",
    KC_O: "O",
    KC_P: "P",
    KC_Q: "A",
    KC_R: "R",
    KC_S: "S",
    KC_T: "T",
    KC_U: "U",
    KC_V: "V",
    KC_W: "Z",
    KC_X: "X",
    KC_Y: "Y",
    KC_Z: "W",
    KC_COMMA: ";",
    KC_DOT: ":",
    KC_COLN: ":",
    KC_SCOLON: "M",
    KC_SCLN: "M",
    KC_SLASH: "!",
    KC_QUOTE: "ù",
    KC_GRAVE: "2",
    KC_1: "&",
    KC_2: "é",
    KC_3: '"',
    KC_4: "'",
    KC_5: "(",
    KC_6: "-",
    KC_7: "è",
    KC_8: "_",
    KC_9: "ç",
    KC_0: "à",
    KC_MINUS: ")",
    KC_EQL: "=",
    KC_EQUAL: "=",
    KC_LBRACKET: "^",
    KC_RBRACKET: "$",
    KC_NONUS_BSLASH: "<",
    KC_BSLS: "*",
    KC_BACKSLASH: "*",
    KC_KP_0: "0",
    KC_KP_1: "1",
    KC_KP_2: "2",
    KC_KP_3: "3",
    KC_KP_4: "4",
    KC_KP_5: "5",
    KC_KP_6: "6",
    KC_KP_7: "7",
    KC_KP_8: "8",
    KC_KP_9: "9",
    KC_KP_DOT: ".",
    KC_KP_SLASH: "/",
    KC_KP_MINUS: "-",
    KC_KP_ASTERISK: "*",
    KC_F1: "F1",
    KC_F2: "F2",
    KC_F3: "F3",
    KC_F4: "F4",
    KC_F5: "F5",
    KC_F6: "F6",
    KC_F7: "F7",
    KC_F8: "F8",
    KC_F9: "F9",
    KC_F10: "F10",
    KC_F11: "F11",
    KC_F12: "F12",
}

const azertyShiftMap: Record<string, string> = {
    KC_QUOTE: "%",
    KC_NONUS_BSLASH: ">",
    KC_EQUAL: "+",
    KC_EQL: "+",
    KC_M: "?",
    KC_DOT: "/",
    KC_COLN: "/",
    KC_SLASH: "§",
}

const azertyAltGrMap: Record<string, string> = {
    KC_0: "@",
    KC_2: "~",
    KC_3: "#",
    KC_4: "{",
    KC_5: "[",
    KC_6: "|",
    KC_7: "`",
    KC_8: "\\",
    KC_MINUS: "]",
    KC_EQUAL: "}",
    KC_EQL: "}",
}

const readableLabelOverrides: Record<string, string> = {
    "C_S(KC_TAB)": "<< Pg",
    "LCTL(KC_TAB)": "Pg >>",
    "LSFT(KC_TAB)": "<< Tab"
}

function isRecord(value: unknown): value is UnknownRecord {
    return typeof value === "object" && value !== null && !Array.isArray(value)
}

function baseLabel(code: string) {
    return azertyBaseMap[code] ?? code.replace(/^KC_/, "")
}

function readableLabel(raw: string): string {
    const override = readableLabelOverrides[raw]
    if (override) {
        return override
    }

    const shiftMatch = raw.match(/^(?:LSFT|RSFT|S)\((.+)\)$/)
    if (shiftMatch) {
        const inner = shiftMatch[1]
        return azertyShiftMap[inner] ?? `Shift+${readableLabel(inner)}`
    }

    const altGrMatch = raw.match(/^RALT\((.+)\)$/)
    if (altGrMatch) {
        const inner = altGrMatch[1]
        return azertyAltGrMap[inner] ?? `AltGr+${readableLabel(inner)}`
    }

    const ctrlMatch = raw.match(/^LCTL\((.+)\)$/)
    if (ctrlMatch) {
        return `Ctrl+${readableLabel(ctrlMatch[1])}`
    }

    const altMatch = raw.match(/^LALT\((.+)\)$/)
    if (altMatch) {
        const inner = altMatch[1]
        return azertyAltGrMap[inner] ?? `Alt+${readableLabel(inner)}`
    }

    const ctrlShiftMatch = raw.match(/^C_S\((.+)\)$/)
    if (ctrlShiftMatch) {
        return `Ctrl+Shift+${readableLabel(ctrlShiftMatch[1])}`
    }

    return baseLabel(raw)
}

function actionFromVialValue(value: unknown): KeyboardAction | null {
    if (value === -1 || value === null || value === undefined) {
        return null
    }

    const raw = String(value)

    if (raw === "KC_TRNS") {
        return {
            type: "special",
            value: "transparent",
            label: "",
            description: "Transparent key. Falls through to a lower layer.",
        }
    }

    if (raw === "KC_NO") {
        return {
            type: "special",
            value: "no",
            label: "",
            description: "No action assigned.",
        }
    }

    const macroMatch = raw.match(/^M(\d+)$/)
    if (macroMatch) {
        return {
            type: "macro",
            macroId: `macro-${macroMatch[1]}`,
            label: `Macro ${macroMatch[1]}`,
            description: `Runs Vial macro ${macroMatch[1]}.`,
        }
    }

    const layerMatch = raw.match(/^(MO|TG|TO|OSL|TT)\((\d+)\)$/)
    if (layerMatch) {
        const modeByCode = {
            MO: "momentary",
            TG: "toggle",
            TO: "tap",
            OSL: "one-shot",
            TT: "tap",
        } as const

        return {
            type: "layer",
            mode: modeByCode[layerMatch[1] as keyof typeof modeByCode],
            targetLayerId: `m${layerMatch[2]}`,
            label: raw,
            description: `${raw} imported from the Vial backup.`,
        }
    }

    const tapDanceMatch = raw.match(/^TD\((\d+)\)$/)
    if (tapDanceMatch) {
        return {
            type: "tapDance",
            label: `Tap Dance ${tapDanceMatch[1]}`,
            description: `Tap Dance slot ${tapDanceMatch[1]}.`,
        }
    }

    if (/^(?:LCTL|LALT|RALT|LSFT|RSFT|S|C_S)\(/.test(raw)) {
        return {
            type: "special",
            value: raw,
            label: readableLabel(raw),
            description: `${raw} rendered as ${readableLabel(raw)} for readability.`,
        }
    }

    const label = readableLabel(raw)
    return {
        type: "keycode",
        code: raw,
        label,
        description: `Displays ${label}. Source: ${raw}.`,
    }
}

function flattenLayoutKeys(config: KeyboardConfiguration) {
    return config.layout.halves.flatMap((half) => half.keys)
}

function buildLabels(layoutKeys: LayoutKey[], layers: KeyboardLayer[]) {
    const maxIndex = Math.max(...layoutKeys.map((key) => key.labelIndex))
    const labels = Array.from({length: maxIndex + 1}, () => "")

    for (const layoutKey of layoutKeys) {
        for (const layer of layers) {
            const label = layer.keys[layoutKey.id]?.label
            if (label) {
                labels[layoutKey.labelIndex] = label
                break
            }
        }
    }

    return labels
}

function parseMacros(value: unknown): KeyboardMacro[] {
    if (!Array.isArray(value)) {
        return []
    }

    return value
        .map((steps, index) => ({index, steps}))
        .filter((entry) => Array.isArray(entry.steps) && entry.steps.length > 0)
        .map(({index, steps}) => ({
            id: `macro-${index}`,
            name: `Macro ${index}`,
            steps: (steps as unknown[]).map((step) => (Array.isArray(step) ? step.map(String).join(" + ") : String(step))),
            description: `Imported from Vial macro slot ${index}.`,
        }))
}

export function isVialBackup(value: unknown): value is VialBackup {
    return isRecord(value) && Array.isArray(value.layout)
}

export function convertVialToKeyboardConfig(vial: VialBackup, baseConfig: KeyboardConfiguration, fileName?: string): KeyboardConfiguration {
    if (!Array.isArray(vial.layout)) {
        throw new Error("This .vil file does not contain a valid layout array.")
    }

    const layoutKeys = flattenLayoutKeys(baseConfig)
    const layers: KeyboardLayer[] = vial.layout.map((matrix, layerIndex) => {
        const keys: Record<string, KeyboardAction> = {}

        if (!Array.isArray(matrix)) {
            return {
                id: `m${layerIndex}`,
                name: `M${layerIndex}`,
                description: `Imported from ${fileName ?? "Vial backup"} layer ${layerIndex}.`,
                keys,
            }
        }

        matrix.forEach((row, rowIndex) => {
            if (!Array.isArray(row)) {
                return
            }

            row.forEach((cell, columnIndex) => {
                const keyId = matrixToKeyId[rowIndex]?.[columnIndex]
                const action = actionFromVialValue(cell)
                if (!keyId || !action) {
                    return
                }
                keys[keyId] = action
            })
        })

        return {
            id: `m${layerIndex}`,
            name: `M${layerIndex}`,
            description: `Imported from ${fileName ?? "Vial backup"} layer ${layerIndex}.`,
            keys,
        }
    })

    return {
        id: `vial-${String(vial.uid ?? Date.now())}`,
        name: fileName ? fileName.replace(/\.[^.]+$/, "") : "Imported Vial Layout",
        layout: baseConfig.layout,
        labels: buildLabels(layoutKeys, layers),
        layers,
        macros: parseMacros(vial.macro),
        combos: [],
        specialActions: [
            {id: "transparent", name: "Transparent", description: "Falls through to a lower layer."},
            {id: "no", name: "No action", description: "No key action assigned."},
        ],
    }
}