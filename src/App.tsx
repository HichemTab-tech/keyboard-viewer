import {useEffect, useRef, useState, type CSSProperties, type ReactNode} from "react"
import {toPng} from "html-to-image"
import {keyboardConfig, type KeyboardAction, type KeyboardConfiguration, type KeyboardLayer, type LayoutKey} from "./keyboardConfig"
import {convertVialToKeyboardConfig, isVialBackup} from "./vialImport"

type Mode = "edit" | "preview"

const actionTone: Record<KeyboardAction["type"], string> = {
    keycode: "text-zinc-300",
    layer: "text-cyan-200",
    macro: "text-amber-200",
    combo: "text-emerald-200",
    special: "text-zinc-200",
    tapDance: "text-fuchsia-200",
    holdTap: "text-sky-200",
    oneShot: "text-violet-200",
    mouse: "text-lime-200",
    encoder: "text-orange-200",
    override: "text-rose-200",
}

const centerGuideKeyIds = new Set(["L11", "L12", "L13", "L14", "R11", "R12", "R13", "R14"])

function makeTextAction(label: string, description?: string): KeyboardAction {
    const cleanLabel = label.trim()
    const cleanDescription = description?.trim()

    if (!cleanLabel) {
        return {
            type: "special",
            value: "empty",
            label: "",
            description: cleanDescription || "Empty key.",
        }
    }

    return {
        type: "keycode",
        code: cleanLabel,
        label: cleanLabel,
        description: cleanDescription || undefined,
    }
}

function downloadFile(filename: string, content: string, type: string) {
    const link = document.createElement("a")
    const file = new Blob([content], {type})

    link.href = URL.createObjectURL(file)
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(link.href)
}

function downloadDataUrl(filename: string, dataUrl: string) {
    const link = document.createElement("a")

    link.href = dataUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
}

function formatActionType(type: KeyboardAction["type"]) {
    return type.replace(/[A-Z]/g, (letter) => ` ${letter}`).replace(/^./, (letter) => letter.toUpperCase())
}

function describeAction(action?: KeyboardAction) {
    if (!action) {
        return "No value saved for this key on the selected layer."
    }

    return action.description || "No description yet."
}

function getMacroDetails(config: KeyboardConfiguration, action?: KeyboardAction) {
    if (!action || action.type !== "macro") {
        return null
    }

    return config.macros?.find((macro) => macro.id === action.macroId) ?? null
}

function compactLayerName(layer: KeyboardLayer | undefined, index: number) {
    return layer?.name || `M${index}`
}

type KeyProps = {
    layoutKey: LayoutKey
    action?: KeyboardAction
    origin: {x: number; y: number}
    unit: number
    gap: number
    selected?: boolean
    interactive?: boolean
    onSelect?: () => void
}

function Key({layoutKey, action, origin, unit, gap, selected = false, interactive = false, onSelect}: KeyProps) {
    const width = unit * (layoutKey.w ?? 1)
    const height = unit * (layoutKey.h ?? 1)
    const label = action?.label ?? ""
    const tone = action ? actionTone[action.type] : "text-zinc-600"
    const centerGuideTone = centerGuideKeyIds.has(layoutKey.id) ? "ring-1 ring-amber-300/60 ring-inset" : ""
    const commonClass = `absolute grid place-items-center rounded-[5px] border bg-[#343434]/85 text-[10px] font-medium shadow-[inset_0_0_0_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.035),0_1px_0_rgba(255,255,255,0.025)] transition duration-200 ease-out ${tone} ${
        selected ? "border-cyan-300/50 bg-cyan-400/15" : "border-white/[0.055]"
    } ${centerGuideTone} ${interactive ? "hover:-translate-y-0.5 hover:border-white/10 hover:bg-[#3d3d3d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300/70" : ""}`
    const style: CSSProperties = {
        left: origin.x + layoutKey.x * (unit + gap),
        top: origin.y + layoutKey.y * (unit + gap),
        width,
        height,
        transform: `rotate(${layoutKey.rotation ?? 0}deg)`,
    }

    if (!interactive) {
        return (
            <div className={commonClass} style={style} title={action?.description}>
                <span className="max-w-full px-1 leading-none">{label}</span>
            </div>
        )
    }

    return (
        <button
            type="button"
            aria-label={label ? `${layoutKey.id}: ${label}` : `${layoutKey.id}: empty`}
            className={commonClass}
            onClick={onSelect}
            style={style}
            title={action?.description ?? "Empty key"}
        >
            <span className="max-w-full px-1 leading-none">{label}</span>
        </button>
    )
}

type KeyboardViewProps = {
    config: KeyboardConfiguration
    layer: KeyboardLayer
    selectedKeyId?: string
    onSelectKey?: (keyId: string) => void
    scale?: number
    interactive?: boolean
}

function KeyboardView({config, layer, selectedKeyId, onSelectKey, scale = 1, interactive = false}: KeyboardViewProps) {
    const style: CSSProperties = {
        width: config.layout.width,
        height: config.layout.height,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
    }

    return (
        <div style={{width: config.layout.width * scale, height: config.layout.height * scale}}>
            <div className="relative" style={style}>
                {config.layout.halves.map((half) =>
                    half.keys.map((layoutKey) => (
                        <Key
                            key={layoutKey.id}
                            layoutKey={layoutKey}
                            action={layer.keys[layoutKey.id]}
                            origin={half.origin}
                            unit={config.layout.unit}
                            gap={config.layout.gap}
                            selected={selectedKeyId === layoutKey.id}
                            interactive={interactive}
                            onSelect={() => onSelectKey?.(layoutKey.id)}
                        />
                    )),
                )}
            </div>
        </div>
    )
}

function Panel({title, children}: {title: string; children: ReactNode}) {
    return (
        <section className="rounded-md border border-white/[0.06] bg-[#333333]/75 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{title}</h2>
            {children}
        </section>
    )
}

function isKeyboardConfiguration(value: unknown): value is KeyboardConfiguration {
    return typeof value === "object"
        && value !== null
        && "layout" in value
        && typeof value.layout === "object"
        && value.layout !== null
        && "halves" in value.layout
        && Array.isArray(value.layout.halves)
        && "layers" in value
        && Array.isArray(value.layers)
}

export default function Home() {
    const [viewerConfig, setViewerConfig] = useState<KeyboardConfiguration>(keyboardConfig)
    const [mode, setMode] = useState<Mode>("edit")
    const [keyboardScale, setKeyboardScale] = useState(1)
    const [activeLayerId, setActiveLayerId] = useState(keyboardConfig.layers[0]?.id ?? "")
    const [selectedKeyId, setSelectedKeyId] = useState(keyboardConfig.layout.halves[0]?.keys[0]?.id ?? "")
    const [status, setStatus] = useState("Editing bundled sample configuration.")
    const previewRef = useRef<HTMLDivElement>(null)

    const activeLayer = viewerConfig.layers.find((layer) => layer.id === activeLayerId) ?? viewerConfig.layers[0]
    const activeLayerIndex = Math.max(0, viewerConfig.layers.findIndex((layer) => layer.id === activeLayer?.id))
    const selectedAction = activeLayer?.keys[selectedKeyId]
    const selectedMacro = getMacroDetails(viewerConfig, selectedAction)

    useEffect(() => {
        const updateScale = () => {
            setKeyboardScale(Math.min(1, Math.max(0.42, (window.innerWidth - 360) / viewerConfig.layout.width)))
        }

        updateScale()
        window.addEventListener("resize", updateScale)

        return () => window.removeEventListener("resize", updateScale)
    }, [viewerConfig.layout.width])

    function updateLayer(layerId: string, updater: (layer: KeyboardLayer) => KeyboardLayer) {
        setViewerConfig((current) => ({
            ...current,
            layers: current.layers.map((layer) => (layer.id === layerId ? updater(layer) : layer)),
        }))
    }

    function updateSelectedKey(label: string, description = selectedAction?.description) {
        if (!activeLayer) {
            return
        }

        updateLayer(activeLayer.id, (layer) => ({
            ...layer,
            keys: {
                ...layer.keys,
                [selectedKeyId]: makeTextAction(label, description),
            },
        }))
        setStatus(`Saved ${selectedKeyId} on ${activeLayer.name}.`)
    }

    function updateSelectedDescription(description: string) {
        updateSelectedKey(selectedAction?.label ?? "", description)
    }

    function updateLayerDescription(description: string) {
        if (!activeLayer) {
            return
        }

        updateLayer(activeLayer.id, (layer) => ({...layer, description}))
        setStatus(`Updated ${activeLayer.name} description.`)
    }

    function exportConfig() {
        downloadFile("keyboard-layout.json", JSON.stringify(viewerConfig, null, 2), "application/json")
        setStatus("Exported keyboard-layout.json.")
    }

    async function importConfig(file: File | undefined) {
        if (!file) {
            return
        }

        try {
            const parsed = JSON.parse(await file.text()) as unknown
            const nextConfig = isVialBackup(parsed) ? convertVialToKeyboardConfig(parsed, keyboardConfig, file.name) : parsed

            if (!isKeyboardConfiguration(nextConfig)) {
                throw new Error("This JSON does not look like a keyboard layout export.")
            }

            setViewerConfig(nextConfig)
            setActiveLayerId(nextConfig.layers[0]?.id ?? "")
            setSelectedKeyId(nextConfig.layout.halves[0]?.keys[0]?.id ?? "")
            setStatus(`Imported ${file.name}.${isVialBackup(parsed) ? " Converted from Vial backup." : ""}`)
        } catch (error) {
            setStatus(error instanceof Error ? error.message : "Could not import this file.")
        }
    }

    async function exportPreviewImage() {
        if (!previewRef.current) {
            return
        }

        const dataUrl = await toPng(previewRef.current, {
            backgroundColor: "#404040",
            pixelRatio: 2,
        })

        downloadDataUrl("keyboard-preview.png", dataUrl)
        setStatus("Exported keyboard-preview.png.")
    }

    function exportPreviewPdf() {
        setMode("preview")
        setStatus("Use the browser print dialog to save the preview as PDF.")
        window.setTimeout(() => window.print(), 100)
    }

    return (
        <main className="min-h-screen overflow-hidden bg-[#404040] text-zinc-200 print:overflow-visible">
            <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-6 px-4 py-6 lg:grid lg:grid-cols-[1fr_300px] lg:items-center print:block print:min-h-0 print:max-w-none print:p-0">
                <div className="flex min-w-0 flex-col items-center gap-5 print:block">
                    <header className="w-full max-w-[760px] print:hidden">
                        <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Keyboard layout viewer</p>
                        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
                            <div>
                                <h1 className="text-xl font-semibold text-zinc-100">{viewerConfig.name}</h1>
                                {activeLayer?.description ? <p className="mt-1 text-sm text-zinc-500">{activeLayer.description}</p> : null}
                            </div>
                            <div className="flex rounded-md border border-white/[0.06] bg-black/10 p-1">
                                {(["edit", "preview"] as const).map((nextMode) => (
                                    <button
                                        key={nextMode}
                                        type="button"
                                        className={`rounded px-3 py-1.5 text-sm capitalize transition ${
                                            mode === nextMode ? "bg-cyan-300/15 text-cyan-100" : "text-zinc-500 hover:text-zinc-200"
                                        }`}
                                        onClick={() => setMode(nextMode)}
                                    >
                                        {nextMode}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </header>

                    {mode === "edit" ? (
                        <KeyboardView
                            config={viewerConfig}
                            layer={activeLayer}
                            selectedKeyId={selectedKeyId}
                            onSelectKey={setSelectedKeyId}
                            scale={keyboardScale}
                            interactive
                        />
                    ) : (
                        <div ref={previewRef} className="grid w-full max-w-[900px] gap-5 rounded-md bg-[#404040] p-4 print:max-w-none print:p-0">
                            {viewerConfig.layers.map((layer, index) => (
                                <section key={layer.id} className="rounded-md border border-white/[0.06] bg-[#383838] p-4 print:break-inside-avoid">
                                    <div className="mb-3 flex items-baseline justify-between gap-3">
                                        <h2 className="text-sm font-semibold text-zinc-100">{compactLayerName(layer, index)}</h2>
                                        {layer.description ? <p className="text-xs text-zinc-500">{layer.description}</p> : null}
                                    </div>
                                    <KeyboardView config={viewerConfig} layer={layer} scale={0.78}/>
                                </section>
                            ))}
                            {viewerConfig.macros && viewerConfig.macros.length > 0 ? (
                                <section className="rounded-md border border-white/[0.06] bg-[#383838] p-4 print:break-inside-avoid">
                                    <h2 className="mb-2 text-sm font-semibold text-zinc-100">Macros</h2>
                                    <div className="grid gap-2 text-xs text-zinc-300">
                                        {viewerConfig.macros.map((macro) => (
                                            <div key={macro.id} className="rounded border border-white/[0.06] bg-black/10 p-2">
                                                <p className="font-semibold">{macro.name}</p>
                                                <p className="mt-1 text-zinc-400">{macro.steps.join(" -> ")}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            ) : null}
                        </div>
                    )}
                </div>

                <aside className="grid gap-3 lg:self-center print:hidden">
                    <Panel title="Config">
                        <div className="grid gap-2 text-xs text-zinc-500">
                            <div className="grid grid-cols-2 gap-2">
                                <button type="button" className="rounded-md border border-white/[0.06] bg-black/10 px-3 py-2 text-sm text-zinc-300 transition hover:border-white/15 hover:bg-white/[0.04]" onClick={exportConfig}>
                                    Export JSON
                                </button>
                                <label className="cursor-pointer rounded-md border border-white/[0.06] bg-black/10 px-3 py-2 text-center text-sm text-zinc-300 transition hover:border-white/15 hover:bg-white/[0.04]">
                                    Import JSON
                                    <input className="sr-only" type="file" accept=".json,application/json,.vil" onChange={(event) => void importConfig(event.currentTarget.files?.[0])}/>
                                </label>
                            </div>
                            <p>{status}</p>
                        </div>
                    </Panel>

                    <Panel title="Layers">
                        <div className="grid grid-cols-3 gap-2">
                            {viewerConfig.layers.map((layer, index) => (
                                <button
                                    key={layer.id}
                                    type="button"
                                    className={`rounded-md border px-3 py-2 text-sm transition hover:border-white/15 hover:bg-white/[0.04] ${
                                        activeLayerId === layer.id
                                            ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100"
                                            : "border-white/[0.06] bg-black/10 text-zinc-400"
                                    }`}
                                    onClick={() => setActiveLayerId(layer.id)}
                                >
                                    {compactLayerName(layer, index)}
                                </button>
                            ))}
                        </div>
                        <label className="mt-3 block text-xs text-zinc-500">
                            Layer description
                            <textarea
                                className="mt-1 h-16 w-full resize-none rounded-md border border-white/[0.06] bg-black/15 px-3 py-2 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-cyan-300/40"
                                value={activeLayer?.description ?? ""}
                                onChange={(event) => updateLayerDescription(event.target.value)}
                                placeholder={`Description for ${compactLayerName(activeLayer, activeLayerIndex)}`}
                            />
                        </label>
                    </Panel>

                    <Panel title="Selected key">
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-zinc-500">Key</span>
                                <span className="font-medium text-zinc-200">{selectedKeyId}</span>
                            </div>
                            <label className="block text-xs text-zinc-500">
                                Label
                                <input
                                    className="mt-1 w-full rounded-md border border-white/[0.06] bg-black/15 px-3 py-2 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-cyan-300/40"
                                    value={selectedAction?.label ?? ""}
                                    onChange={(event) => updateSelectedKey(event.target.value)}
                                    placeholder="What should be written on this key?"
                                />
                            </label>
                            <label className="block text-xs text-zinc-500">
                                Key description
                                <textarea
                                    className="mt-1 h-20 w-full resize-none rounded-md border border-white/[0.06] bg-black/15 px-3 py-2 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-cyan-300/40"
                                    value={selectedAction?.description ?? ""}
                                    onChange={(event) => updateSelectedDescription(event.target.value)}
                                    placeholder="What does this key do?"
                                />
                            </label>
                            <div className="rounded border border-white/[0.06] bg-black/10 p-3 text-zinc-400">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-base font-semibold text-zinc-100">{selectedAction?.label || "Empty"}</p>
                                    <span className="text-xs text-zinc-500">{selectedAction ? formatActionType(selectedAction.type) : "Empty"}</span>
                                </div>
                                <p className="mt-1 text-xs leading-relaxed">{describeAction(selectedAction)}</p>
                                {selectedMacro ? (
                                    <div className="mt-2 rounded border border-amber-300/20 bg-amber-300/10 p-2">
                                        <p className="text-xs font-semibold text-amber-100">{selectedMacro.name}</p>
                                        <p className="mt-1 text-xs text-amber-100/80">{selectedMacro.steps.join(" -> ")}</p>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </Panel>

                    <Panel title="Preview export">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <button type="button" className="rounded-md border border-white/[0.06] bg-black/10 px-3 py-2 text-zinc-300 transition hover:border-white/15 hover:bg-white/[0.04]" onClick={() => void exportPreviewImage()}>
                                PNG
                            </button>
                            <button type="button" className="rounded-md border border-white/[0.06] bg-black/10 px-3 py-2 text-zinc-300 transition hover:border-white/15 hover:bg-white/[0.04]" onClick={exportPreviewPdf}>
                                PDF
                            </button>
                        </div>
                    </Panel>
                </aside>
            </div>
        </main>
    )
}
