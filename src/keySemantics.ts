import type {KeyboardAction} from "./keyboardConfig"

export type VialTapDanceEntry = [unknown, unknown, unknown, unknown, unknown]

export type VialActionContext = {
    tapDance?: unknown
}

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
    KC_CAPSLOCK: "Caps Lock",
    KC_HOME: "Home",
    KC_END: "End",
    KC_UP: "↑",
    KC_DOWN: "↓",
    KC_LEFT: "←",
    KC_RIGHT: "→",
    KC_PGUP: "PgUp",
    KC_PGDN: "PgDn",
    KC_PGDOWN: "PgDn",
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
    KC_GRAVE: "²",
    KC_1: "&",
    KC_2: "é",
    KC_3: "\"",
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
    KC_KP_MINUS: "−",
    KC_KP_PLUS: "+",
    KC_KP_ASTERISK: "×",
    KC_WH_U: "Wheel ↑",
    KC_WH_D: "Wheel ↓",
    KC_BRID: "Brightness −",
    KC_BRIU: "Brightness +",
    KC_VOLD: "Volume −",
    KC_VOLU: "Volume +",
    KC_MUTE: "Mute",
    KC_MPRV: "Previous",
    KC_MPLY: "Play / Pause",
    KC_MNXT: "Next",
    KC_LNUM: "Num Lock",
    QK_CAPS_WORD_TOGGLE: "Caps Word",
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

const modifierNames: Record<string, string[]> = {
    LCTL: ["Ctrl"],
    RCTL: ["Ctrl"],
    LSFT: ["Shift"],
    RSFT: ["Shift"],
    S: ["Shift"],
    LALT: ["Alt"],
    RALT: ["AltGr"],
    LGUI: ["GUI"],
    RGUI: ["GUI"],
    C_S: ["Ctrl", "Shift"],
    RCG: ["Ctrl", "GUI"],
    LCG: ["Ctrl", "GUI"],
    MEH: ["Ctrl", "Shift", "Alt"],
    HYPR: ["Ctrl", "Shift", "Alt", "GUI"],
}

const semanticShortcuts: Record<string, string> = {
    "LGUI(KC_C)": "Copy",
    "LGUI(KC_V)": "Paste",
    "LGUI(KC_X)": "Cut",
    "LGUI(KC_Z)": "Undo",
}

function sourceMetadata(source: string, extra: Record<string, string | number | boolean> = {}) {
    return {source, ...extra}
}

function titleCase(value: string) {
    return value
        .toLowerCase()
        .split("_")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
}

export function baseLabel(code: string) {
    const mapped = azertyBaseMap[code]
    if (mapped) {
        return mapped
    }

    const functionKey = code.match(/^KC_F(\d+)$/)
    if (functionKey) {
        return `F${functionKey[1]}`
    }

    return titleCase(code.replace(/^(?:KC|QK)_/, "")) || code
}

function modifierAction(raw: string, wrapper: string, inner: string): KeyboardAction {
    const innerLabel = baseLabel(inner)
    const modifiers = modifierNames[wrapper]
    const chord = [...modifiers, innerLabel].join(" + ")
    const shiftedLabel = modifiers.length === 1 && modifiers[0] === "Shift" ? azertyShiftMap[inner] : undefined
    const altGrLabel = modifiers.length === 1 && modifiers[0] === "AltGr" ? azertyAltGrMap[inner] : undefined
    const semanticLabel = semanticShortcuts[raw]
    const label = semanticLabel ?? shiftedLabel ?? altGrLabel ?? chord

    return {
        type: "special",
        value: raw,
        label,
        legend: semanticLabel || shiftedLabel || altGrLabel ? chord : undefined,
        description: `${raw} sends ${chord}.`,
        metadata: sourceMetadata(raw),
    }
}

function tapDanceAction(raw: string, slot: number, context: VialActionContext): KeyboardAction {
    const entry = Array.isArray(context.tapDance) ? context.tapDance[slot] : undefined
    if (!Array.isArray(entry)) {
        return {
            type: "tapDance",
            label: `Tap Dance ${slot}`,
            description: `Tap Dance slot ${slot}; no definition was present in the backup.`,
            metadata: sourceMetadata(raw, {slot}),
        }
    }

    const tap = actionFromVialValue(entry[0])
    const alternatives: Array<[string, unknown]> = [
        ["Hold", entry[1]],
        ["Double", entry[2]],
        ["Tap + hold", entry[3]],
    ]
    const alternate = alternatives
        .map(([gesture, value]) => [gesture, actionFromVialValue(value)] as const)
        .find(([, action]) => action && !("value" in action && action.value === "no"))
    const tappingTerm = typeof entry[4] === "number" ? entry[4] : undefined

    return {
        type: "tapDance",
        label: tap?.label || `Tap Dance ${slot}`,
        legend: alternate?.[1] ? `${alternate[0]} · ${alternate[1].label}` : undefined,
        description: `Tap Dance ${slot}: tap ${tap?.label || "unassigned"}${alternate?.[1] ? `; ${alternate[0].toLowerCase()} ${alternate[1].label}` : ""}.`,
        metadata: sourceMetadata(raw, {slot, ...(tappingTerm === undefined ? {} : {tappingTerm})}),
    }
}

export function actionFromVialValue(value: unknown, context: VialActionContext = {}): KeyboardAction | null {
    if (value === -1 || value === null || value === undefined) {
        return null
    }

    const raw = String(value).trim()

    if (raw === "KC_TRNS") {
        return {
            type: "special",
            value: "transparent",
            label: "",
            description: "Transparent key. Falls through to a lower layer.",
            metadata: sourceMetadata(raw),
        }
    }

    if (raw === "KC_NO") {
        return {
            type: "special",
            value: "no",
            label: "",
            description: "No action assigned.",
            metadata: sourceMetadata(raw),
        }
    }

    const macroMatch = raw.match(/^M(\d+)$/)
    if (macroMatch) {
        return {
            type: "macro",
            macroId: `macro-${macroMatch[1]}`,
            label: `Macro ${macroMatch[1]}`,
            description: `Runs Vial macro ${macroMatch[1]}.`,
            metadata: sourceMetadata(raw),
        }
    }

    const layerTapMatch = raw.match(/^LT(\d+)\((.+)\)$/) ?? raw.match(/^LT\(\s*(\d+)\s*,\s*(.+)\)$/)
    if (layerTapMatch) {
        const [, layer, tapCode] = layerTapMatch
        const tapAction = actionFromVialValue(tapCode, context)
        return {
            type: "holdTap",
            label: tapAction?.label || baseLabel(tapCode),
            legend: `Hold · M${layer}`,
            description: `Tap for ${tapAction?.label || baseLabel(tapCode)}; hold for layer M${layer}. Source: ${raw}.`,
            metadata: sourceMetadata(raw, {targetLayerId: `m${layer}`}),
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
        const mode = modeByCode[layerMatch[1] as keyof typeof modeByCode]
        return {
            type: "layer",
            mode,
            targetLayerId: `m${layerMatch[2]}`,
            label: `M${layerMatch[2]}`,
            legend: mode === "momentary" ? "Hold layer" : titleCase(mode),
            description: `${raw} activates layer M${layerMatch[2]} (${mode}).`,
        }
    }

    const tapDanceMatch = raw.match(/^TD\((\d+)\)$/)
    if (tapDanceMatch) {
        return tapDanceAction(raw, Number(tapDanceMatch[1]), context)
    }

    const modifierMatch = raw.match(/^([A-Z_]+)\((.+)\)$/)
    if (modifierMatch && modifierNames[modifierMatch[1]]) {
        return modifierAction(raw, modifierMatch[1], modifierMatch[2])
    }

    const label = baseLabel(raw)
    return {
        type: "keycode",
        code: raw,
        label,
        description: `Displays ${label}. Source: ${raw}.`,
        metadata: sourceMetadata(raw),
    }
}
