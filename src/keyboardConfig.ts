export type KeyboardAction =
    | {
        type: "keycode"
        code: string
        label: string
        legend?: string
        description?: string
        metadata?: Record<string, string | number | boolean>
    }
    | {
        type: "layer"
        mode: "momentary" | "toggle" | "tap" | "one-shot"
        targetLayerId: string
        label: string
        legend?: string
        description?: string
        metadata?: Record<string, string | number | boolean>
    }
    | {
        type: "macro"
        macroId: string
        label: string
        legend?: string
        description?: string
        metadata?: Record<string, string | number | boolean>
    }
    | {
        type: "combo"
        comboId: string
        label: string
        legend?: string
        description?: string
        metadata?: Record<string, string | number | boolean>
    }
    | {
        type: "special"
        value: string
        label: string
        legend?: string
        description?: string
        metadata?: Record<string, string | number | boolean>
    }
    | {
        type: "tapDance" | "holdTap" | "oneShot" | "mouse" | "encoder" | "override"
        label: string
        legend?: string
        description?: string
        metadata?: Record<string, string | number | boolean>
    }

export type LayoutKey = {
    id: string
    x: number
    y: number
    labelIndex: number
    w?: number
    h?: number
    rotation?: number
}

export type KeyboardLayer = {
    id: string
    name: string
    description?: string
    keys: Record<string, KeyboardAction>
}

export type KeyboardMacro = {
    id: string
    name: string
    steps: string[]
    description?: string
}

export type KeyboardCombo = {
    id: string
    name: string
    keyIds: string[]
    action: KeyboardAction
    description?: string
}

export type KeyboardConfiguration = {
    id: string
    name: string
    layout: {
        unit: number
        gap: number
        width: number
        height: number
        halves: Array<{
            id: "left" | "right"
            origin: {x: number; y: number}
            keys: LayoutKey[]
        }>
    }
    labels: string[]
    layers: KeyboardLayer[]
    macros?: KeyboardMacro[]
    combos?: KeyboardCombo[]
    specialActions?: Array<{id: string; name: string; description: string}>
}

const leftMainKeys: LayoutKey[] = [
    {id: "L00", x: 0, y: 0, labelIndex: 0},
    {id: "L01", x: 1, y: 0, labelIndex: 1},
    {id: "L02", x: 2, y: -0.25, labelIndex: 2},
    {id: "L03", x: 3, y: -0.38, labelIndex: 3},
    {id: "L04", x: 4, y: -0.25, labelIndex: 4},
    {id: "L05", x: 5, y: -0.12, labelIndex: 5},
    {id: "L10", x: 0, y: 1, labelIndex: 6},
    {id: "L11", x: 1, y: 1, labelIndex: 7},
    {id: "L12", x: 2, y: 0.78, labelIndex: 8},
    {id: "L13", x: 3, y: 0.66, labelIndex: 9},
    {id: "L14", x: 4, y: 0.78, labelIndex: 10},
    {id: "L15", x: 5, y: 0.9, labelIndex: 11},
    {id: "L20", x: 0, y: 2, labelIndex: 12},
    {id: "L21", x: 1, y: 2, labelIndex: 13},
    {id: "L22", x: 2, y: 1.82, labelIndex: 14},
    {id: "L23", x: 3, y: 1.7, labelIndex: 15},
    {id: "L24", x: 4, y: 1.82, labelIndex: 16},
    {id: "L25", x: 5, y: 1.95, labelIndex: 17},
    {id: "L06", x: 6.05, y: 0.42, labelIndex: 18},
    {id: "L16", x: 6.05, y: 1.42, labelIndex: 19},
]

const leftThumbKeys: LayoutKey[] = [
    {id: "LT0", x: 3.55, y: 3.04, labelIndex: 20},
    {id: "LT1", x: 4.55, y: 3.08, labelIndex: 21, rotation: 15},
    {id: "LT2", x: 5.55, y: 3.12, labelIndex: 22, w: 0.92, h: 1.42, rotation: 29},
]

const rightMainKeys: LayoutKey[] = leftMainKeys.map((key, index) => ({
    ...key,
    id: key.id.replace("L", "R"),
    x: 6.05 - key.x,
    labelIndex: 26 + index,
}))

const rightThumbKeys: LayoutKey[] = [
    {id: "RT2", x: 1.26, y: 3.14, labelIndex: 46, w: 0.92, h: 1.42, rotation: -29},
    {id: "RT1", x: 2.26, y: 3.1, labelIndex: 47, rotation: -15},
    {id: "RT0", x: 3.26, y: 3.05, labelIndex: 48},
]

const layoutKeys = [...leftMainKeys, ...leftThumbKeys, ...rightMainKeys, ...rightThumbKeys]

const baseLabels = [
    "Q", "W", "E", "R", "T", "[", "A", "S", "D", "F", "G", "]", "Z", "X", "C", "V", "B", "\\", "Esc", "Tab", "Shift", "MO(1)", "Space",
    "", "", "",
    "Y", "U", "I", "O", "P", "-", "H", "J", "K", "L", ";", "=", "N", "M", ",", ".", "/", "'", "Bksp", "Enter", "Space", "MO(2)", "Ctrl",
]

const symbolLabels = [
    "!", "@", "#", "$", "%", "", "1", "2", "3", "4", "5", "", "F1", "F2", "F3", "F4", "F5", "", "~", "", "", "", "",
    "", "", "",
    "^", "&", "*", "(", ")", "", "6", "7", "8", "9", "0", "", "F6", "F7", "F8", "F9", "F10", "", "Del", "", "", "", "",
]

const navLabels = [
    "Esc", "Home", "Up", "End", "PgUp", "", "Caps", "Left", "Down", "Right", "PgDn", "", "Undo", "Cut", "Copy", "Paste", "Redo", "", "", "", "", "", "",
    "", "", "",
    "Vol+", "Mute", "Play", "Next", "Macro 2", "", "Vol-", "MsL", "MsD", "MsU", "MsR", "", "", "WheelL", "WheelD", "WheelU", "WheelR", "", "Esc Combo", "", "", "", "",
]

function actionFromLabel(label: string): KeyboardAction {
    if (!label) {
        return {type: "special", value: "transparent", label: "", description: "Transparent or unassigned key."}
    }

    if (label.startsWith("MO(")) {
        return {
            type: "layer",
            mode: "momentary",
            targetLayerId: label.includes("2") ? "m2" : "m1",
            label,
            description: "Momentarily activates another layer while held.",
        }
    }

    if (label.startsWith("Macro")) {
        return {type: "macro", macroId: "macro-2", label, description: "Runs a configured macro sequence."}
    }

    if (label.includes("Combo")) {
        return {type: "combo", comboId: "esc-combo", label, description: "Represents a combo-triggered action."}
    }

    if (["MsL", "MsD", "MsU", "MsR", "WheelL", "WheelD", "WheelU", "WheelR"].includes(label)) {
        return {type: "mouse", label, description: "Mouse movement or wheel action."}
    }

    return {type: "keycode", code: label, label, description: `Sends ${label}.`}
}

function layerFromLabels(id: string, name: string, labels: string[], description: string): KeyboardLayer {
    return {
        id,
        name,
        description,
        keys: Object.fromEntries(layoutKeys.map((key) => [key.id, actionFromLabel(labels[key.labelIndex] ?? "")])),
    }
}

export const keyboardConfig: KeyboardConfiguration = {
    id: "split-layout-viewer-demo",
    name: "Split Layout Viewer",
    layout: {
        unit: 44,
        gap: 7,
        width: 760,
        height: 284,
        halves: [
            {id: "left", origin: {x: 0, y: 0}, keys: [...leftMainKeys, ...leftThumbKeys]},
            {id: "right", origin: {x: 418, y: -6}, keys: [...rightMainKeys, ...rightThumbKeys]},
        ],
    },
    labels: baseLabels,
    layers: [
        layerFromLabels("m0", "M0", baseLabels, "Primary typing layer."),
        layerFromLabels("m1", "M1", symbolLabels, "Numbers, symbols, and function keys."),
        layerFromLabels("m2", "M2", navLabels, "Navigation, mouse keys, media, macros, and combos."),
    ],
    macros: [
        {id: "macro-2", name: "Macro 2", steps: ["Ctrl+L", "type search", "Enter"], description: "Example macro metadata for read-only display."},
    ],
    combos: [
        {id: "esc-combo", name: "Esc Combo", keyIds: ["RT0", "RT1"], action: {type: "keycode", code: "Esc", label: "Esc"}, description: "Example combo that resolves to Escape."},
    ],
    specialActions: [
        {id: "transparent", name: "Transparent", description: "Falls through to a lower layer in firmware-style layouts."},
    ],
}
