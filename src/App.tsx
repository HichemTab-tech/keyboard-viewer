import {useEffect, useState, type CSSProperties} from "react"
import {keyboardConfig, type KeyboardAction, type LayoutKey} from "./keyboardConfig"

const actionTone: Record<KeyboardAction["type"], string> = {
    keycode: "text-zinc-300",
    layer: "text-cyan-200",
    macro: "text-amber-200",
    combo: "text-emerald-200",
    special: "text-zinc-500",
    tapDance: "text-fuchsia-200",
    holdTap: "text-sky-200",
    oneShot: "text-violet-200",
    mouse: "text-lime-200",
    encoder: "text-orange-200",
    override: "text-rose-200",
}

type KeyProps = {
    layoutKey: LayoutKey
    action?: KeyboardAction
    origin: {x: number; y: number}
    unit: number
    gap: number
    selected: boolean
    onSelect: () => void
}

function Key({layoutKey, action, origin, unit, gap, selected, onSelect}: KeyProps) {
    const width = unit * (layoutKey.w ?? 1)
    const height = unit * (layoutKey.h ?? 1)
    const label = action?.label ?? ""
    const tone = action ? actionTone[action.type] : "text-zinc-600"

    return (
        <button
            type="button"
            aria-label={label ? `${layoutKey.id}: ${label}` : `${layoutKey.id}: empty`}
            title={action?.description ?? "Empty key slot"}
            className={`absolute grid place-items-center rounded-[5px] border bg-[#343434]/85 text-[10px] font-medium shadow-[inset_0_0_0_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.035),0_1px_0_rgba(255,255,255,0.025)] transition duration-200 ease-out hover:-translate-y-0.5 hover:border-white/10 hover:bg-[#3d3d3d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300/70 ${tone} ${
                selected ? "border-cyan-300/50 bg-cyan-400/15" : "border-white/[0.055]"
            }`}
            onClick={onSelect}
            style={{
                left: origin.x + layoutKey.x * (unit + gap),
                top: origin.y + layoutKey.y * (unit + gap),
                width,
                height,
                transform: `rotate(${layoutKey.rotation ?? 0}deg)`,
            }}
        >
            <span className="max-w-full px-1 leading-none">{label}</span>
            {action?.legend ? (
                <span className="absolute bottom-1 right-1 text-[8px] uppercase tracking-wide text-zinc-600">
                    {action.legend}
                </span>
            ) : null}
        </button>
    )
}

function formatActionType(type: KeyboardAction["type"]) {
    return type.replace(/[A-Z]/g, (letter) => ` ${letter}`).replace(/^./, (letter) => letter.toUpperCase())
}

function describeAction(action?: KeyboardAction) {
    if (!action) {
        return "No action assigned for this key on the selected layer."
    }

    if (action.description) {
        return action.description
    }

    switch (action.type) {
        case "keycode":
            return `Sends ${action.code}.`
        case "layer":
            return `${action.mode} access to layer ${action.targetLayerId}.`
        case "macro":
            return `Displays macro ${action.macroId}.`
        case "combo":
            return `Displays combo ${action.comboId}.`
        case "special":
            return action.value
        default:
            return "Advanced keyboard action metadata."
    }
}

function Panel({title, children}: {title: string; children: React.ReactNode}) {
    return (
        <section className="rounded-md border border-white/[0.06] bg-[#333333]/75 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{title}</h2>
            {children}
        </section>
    )
}

export default function Home() {
    const [keyboardScale, setKeyboardScale] = useState(1)
    const [activeLayerId, setActiveLayerId] = useState(keyboardConfig.layers[0]?.id ?? "")
    const [selectedKeyId, setSelectedKeyId] = useState(keyboardConfig.layout.halves[0]?.keys[0]?.id ?? "")
    const activeLayer = keyboardConfig.layers.find((layer) => layer.id === activeLayerId) ?? keyboardConfig.layers[0]
    const selectedAction = activeLayer?.keys[selectedKeyId]

    useEffect(() => {
        const updateScale = () => {
            setKeyboardScale(Math.min(1, Math.max(0.42, (window.innerWidth - 32) / keyboardConfig.layout.width)))
        }

        updateScale()
        window.addEventListener("resize", updateScale)

        return () => window.removeEventListener("resize", updateScale)
    }, [])

    const frameStyle: CSSProperties = {
        width: keyboardConfig.layout.width * keyboardScale,
        height: keyboardConfig.layout.height * keyboardScale,
    }
    const keyboardStyle: CSSProperties = {
        transform: `scale(${keyboardScale})`,
        transformOrigin: "top left",
    }

    return (
        <main className="min-h-screen overflow-hidden bg-[#404040] text-zinc-200">
            <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-6 px-4 py-6 lg:grid lg:grid-cols-[1fr_290px] lg:items-center">
                <div className="flex min-w-0 flex-col items-center gap-5">
                    <header className="w-full max-w-[760px]">
                        <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Configuration viewer</p>
                        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
                            <div>
                                <h1 className="text-xl font-semibold text-zinc-100">{keyboardConfig.name}</h1>
                                <p className="mt-1 text-sm text-zinc-500">{activeLayer?.description}</p>
                            </div>
                            <div className="rounded-md border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-sm text-cyan-100">
                                Layer: {activeLayer?.name}
                            </div>
                        </div>
                    </header>

                    <div style={frameStyle}>
                        <div className="relative h-[284px] w-[760px]" style={keyboardStyle}>
                            {keyboardConfig.layout.halves.map((half) =>
                                half.keys.map((layoutKey) => (
                                    <Key
                                        key={layoutKey.id}
                                        layoutKey={layoutKey}
                                        action={activeLayer?.keys[layoutKey.id]}
                                        origin={half.origin}
                                        unit={keyboardConfig.layout.unit}
                                        gap={keyboardConfig.layout.gap}
                                        selected={selectedKeyId === layoutKey.id}
                                        onSelect={() => setSelectedKeyId(layoutKey.id)}
                                    />
                                )),
                            )}
                        </div>
                    </div>
                </div>

                <aside className="grid gap-3 lg:self-center">
                    <Panel title="Layers">
                        <div className="grid gap-2">
                            {keyboardConfig.layers.map((layer) => (
                                <button
                                    key={layer.id}
                                    type="button"
                                    className={`rounded-md border px-3 py-2 text-left text-sm transition hover:border-white/15 hover:bg-white/[0.04] ${
                                        activeLayerId === layer.id
                                            ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100"
                                            : "border-white/[0.06] bg-black/10 text-zinc-400"
                                    }`}
                                    onClick={() => setActiveLayerId(layer.id)}
                                >
                                    <span className="block font-medium">{layer.name}</span>
                                    <span className="mt-0.5 block text-xs text-zinc-500">{layer.description}</span>
                                </button>
                            ))}
                        </div>
                    </Panel>

                    <Panel title="Action details">
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-zinc-500">Key</span>
                                <span className="font-medium text-zinc-200">{selectedKeyId}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-zinc-500">Type</span>
                                <span className="font-medium text-zinc-200">{selectedAction ? formatActionType(selectedAction.type) : "Empty"}</span>
                            </div>
                            <div className="rounded border border-white/[0.06] bg-black/10 p-3 text-zinc-400">
                                <p className="text-base font-semibold text-zinc-100">{selectedAction?.label || "Empty"}</p>
                                <p className="mt-1 text-xs leading-relaxed">{describeAction(selectedAction)}</p>
                            </div>
                        </div>
                    </Panel>

                    <Panel title="Inspectors">
                        <div className="grid gap-3 text-xs text-zinc-500">
                            <div>
                                <p className="font-medium text-zinc-300">Macros</p>
                                <p>{keyboardConfig.macros?.map((macro) => macro.name).join(", ") || "None"}</p>
                            </div>
                            <div>
                                <p className="font-medium text-zinc-300">Combos</p>
                                <p>{keyboardConfig.combos?.map((combo) => combo.name).join(", ") || "None"}</p>
                            </div>
                            <div>
                                <p className="font-medium text-zinc-300">Special actions</p>
                                <p>{keyboardConfig.specialActions?.map((action) => action.name).join(", ") || "None"}</p>
                            </div>
                        </div>
                    </Panel>
                </aside>
            </div>
        </main>
    )
}
