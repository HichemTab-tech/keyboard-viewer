// noinspection SpellCheckingInspection

import type {KeyboardAction, KeyboardConfiguration, KeyboardLayer, KeyboardMacro, LayoutKey} from "./keyboardConfig"
import {actionFromVialValue, type VialActionContext} from "./keySemantics"

type UnknownRecord = Record<string, unknown>

type VialBackup = {
    version?: number
    uid?: number | string
    layout?: unknown
    macro?: unknown
    combo?: unknown
    tap_dance?: unknown
}

const matrixToKeyId: Array<Array<string | null>> = [
    ["L00", "L01", "L02", "L03", "L04", "L05", "R06", "R05", "R04", "R03", "R02", "R01"],
    ["L10", "L11", "L12", "L13", "L14", "L15", "R16", "R15", "R14", "R13", "R12", "R11"],
    ["L20", "L21", "L22", "L23", "L24", "L25", null, "R25", "R24", "R23", "R22", "R21"],
    ["L06", "L16", null, "LT0", "LT1", "LT2", "RT2", "RT1", "RT0", "R00", "R10", "R20"],
]

function isRecord(value: unknown): value is UnknownRecord {
    return typeof value === "object" && value !== null && !Array.isArray(value)
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

function formatMacroStep(step: unknown) {
    if (!Array.isArray(step)) {
        return String(step)
    }

    const [event, ...codes] = step.map(String)
    const keys = codes
        .map((code) => actionFromVialValue(code)?.label || code)
        .join(" + ")

    if (!keys) {
        return event
    }

    return `${event.charAt(0).toUpperCase()}${event.slice(1)} ${keys}`
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
            steps: (steps as unknown[]).map(formatMacroStep),
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
    const actionContext: VialActionContext = {tapDance: vial.tap_dance}
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
                const action = actionFromVialValue(cell, actionContext)
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
