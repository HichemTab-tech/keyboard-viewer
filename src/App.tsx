import {useEffect, useRef, useState, type ReactNode} from "react"
import {toPng} from "html-to-image"
import {KeyboardView} from "./components/KeyboardView"
import {keyboardConfig, type KeyboardAction, type KeyboardConfiguration, type KeyboardLayer} from "./keyboardConfig"
import {convertVialToKeyboardConfig, isVialBackup} from "./vialImport"

type Mode = "edit" | "preview"
const LOCAL_STORAGE_CONFIG_KEY = "keyboard-viewer.config"

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

function meaningfulPreviewLayerIds(config: KeyboardConfiguration) {
    const meaningful = config.layers.filter((layer) => Object.values(layer.keys).some((action) => (
        action.type !== "special" || !["no", "transparent"].includes(action.value)
    )))

    return (meaningful.length > 0 ? meaningful : config.layers.slice(0, 1)).map((layer) => layer.id)
}

function Panel({title, children}: {title: string; children: ReactNode}) {
    return (
        <section className="control-panel">
            <h2 className="control-panel__title">{title}</h2>
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

function loadPersistedConfig() {
    if (typeof window === "undefined") {
        return {config: keyboardConfig, restored: false}
    }

    try {
        const raw = window.localStorage.getItem(LOCAL_STORAGE_CONFIG_KEY)
        if (!raw) {
            return {config: keyboardConfig, restored: false}
        }

        const parsed = JSON.parse(raw) as unknown
        if (!isKeyboardConfiguration(parsed)) {
            return {config: keyboardConfig, restored: false}
        }

        return {config: parsed, restored: true}
    } catch {
        return {config: keyboardConfig, restored: false}
    }
}

export default function Home() {
    const initialStateRef = useRef(loadPersistedConfig())
    const [viewerConfig, setViewerConfig] = useState<KeyboardConfiguration>(initialStateRef.current.config)
    const [mode, setMode] = useState<Mode>("edit")
    const [activeLayerId, setActiveLayerId] = useState(initialStateRef.current.config.layers[0]?.id ?? "")
    const [selectedKeyId, setSelectedKeyId] = useState(initialStateRef.current.config.layout.halves[0]?.keys[0]?.id ?? "")
    const [status, setStatus] = useState(
        initialStateRef.current.restored
            ? "Loaded saved layout from local storage."
            : "Editing bundled sample configuration.",
    )
    const [previewLayerIds, setPreviewLayerIds] = useState<string[]>(() => meaningfulPreviewLayerIds(initialStateRef.current.config))
    const [isPreviewSidebarHidden, setIsPreviewSidebarHidden] = useState(false)
    const previewRef = useRef<HTMLDivElement>(null)
    const hasHydratedConfigRef = useRef(false)

    const activeLayer = viewerConfig.layers.find((layer) => layer.id === activeLayerId) ?? viewerConfig.layers[0]
    const activeLayerIndex = Math.max(0, viewerConfig.layers.findIndex((layer) => layer.id === activeLayer?.id))
    const selectedAction = activeLayer?.keys[selectedKeyId]
    const selectedMacro = getMacroDetails(viewerConfig, selectedAction)
    const previewLayers = viewerConfig.layers.filter((layer) => previewLayerIds.includes(layer.id))
    const previewUsesGrid = mode === "preview" && isPreviewSidebarHidden

    useEffect(() => {
        if (!hasHydratedConfigRef.current) {
            hasHydratedConfigRef.current = true
            return
        }

        try {
            window.localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify(viewerConfig))
        } catch {
            setStatus("Could not save layout to local storage.")
        }
    }, [viewerConfig])

    function updateLayer(layerId: string, updater: (layer: KeyboardLayer) => KeyboardLayer) {
        setViewerConfig((current) => ({
            ...current,
            layers: current.layers.map((layer) => (layer.id === layerId ? updater(layer) : layer)),
        }))
    }

    function updateSelectedLabel(label: string) {
        if (!activeLayer) {
            return
        }

        updateLayer(activeLayer.id, (layer) => ({
            ...layer,
            keys: {
                ...layer.keys,
                [selectedKeyId]: selectedAction
                    ? {...selectedAction, label: label.trim()}
                    : makeTextAction(label),
            },
        }))
        setStatus(`Saved ${selectedKeyId} on ${activeLayer.name}.`)
    }

    function updateSelectedDescription(description: string) {
        if (!activeLayer) {
            return
        }

        updateLayer(activeLayer.id, (layer) => ({
            ...layer,
            keys: {
                ...layer.keys,
                [selectedKeyId]: selectedAction
                    ? {...selectedAction, description: description.trim() || undefined}
                    : makeTextAction("", description),
            },
        }))
        setStatus(`Updated ${selectedKeyId} on ${activeLayer.name}.`)
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
            setPreviewLayerIds(meaningfulPreviewLayerIds(nextConfig))
            setStatus(`Imported ${file.name}.${isVialBackup(parsed) ? " Converted from Vial backup." : ""}`)
        } catch (error) {
            setStatus(error instanceof Error ? error.message : "Could not import this file.")
        }
    }

    function togglePreviewLayer(layerId: string) {
        setPreviewLayerIds((current) =>
            current.includes(layerId)
                ? (current.length > 1 ? current.filter((id) => id !== layerId) : current)
                : [...current, layerId],
        )
    }

    function showAllPreviewLayers() {
        setPreviewLayerIds(viewerConfig.layers.map((layer) => layer.id))
    }

    async function preparePreviewExport() {
        setMode("preview")
        setIsPreviewSidebarHidden(true)

        await new Promise<void>((resolve) => window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => resolve())
        }))
    }

    async function exportPreviewImage() {
        try {
            setStatus("Rendering keyboard-preview.png…")
            await preparePreviewExport()
            await document.fonts.ready
            const preview = previewRef.current
            if (!preview) {
                throw new Error("Preview did not render.")
            }

            const dataUrl = await toPng(preview, {
                backgroundColor: "#111318",
                pixelRatio: 2,
            })

            downloadDataUrl("keyboard-preview.png", dataUrl)
            setStatus("Exported keyboard-preview.png.")
        } catch {
            setStatus("Could not export the preview image. Try fewer layers or a smaller browser window.")
        }
    }

    function clearPersistedConfig() {
        try {
            window.localStorage.removeItem(LOCAL_STORAGE_CONFIG_KEY)
            setStatus("Deleted saved local data.")
        } catch {
            setStatus("Could not delete local saved data.")
        }
    }

    async function exportPreviewPdf() {
        setStatus("Use the browser print dialog to save the preview as PDF.")
        await preparePreviewExport()
        window.print()
    }

    return (
        <main className="app-shell min-h-screen overflow-hidden text-zinc-200 print:overflow-visible">
            <div className={`app-layout mx-auto flex min-h-screen w-full flex-col justify-start gap-7 px-5 py-8 print:block print:min-h-0 print:max-w-none print:p-0 ${
                mode === "preview" && isPreviewSidebarHidden
                    ? "max-w-[2480px]"
                    : "max-w-[1320px] lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start"
            }`}>
                <div className="flex min-w-0 flex-col items-center gap-6 print:block">
                    <header className={`app-header w-full print:hidden ${previewUsesGrid ? "max-w-[2440px]" : "max-w-[820px]"}`}>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300/65">Keyboard layout viewer</p>
                        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
                            <div>
                                <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">{viewerConfig.name}</h1>
                                {activeLayer?.description ? <p className="mt-1 text-sm text-zinc-400">{activeLayer.description}</p> : null}
                            </div>
                            <div className="mode-switch">
                                {(["edit", "preview"] as const).map((nextMode) => (
                                    <button
                                        key={nextMode}
                                        type="button"
                                        className={`mode-switch__button ${
                                            mode === nextMode ? "mode-switch__button--active" : ""
                                        }`}
                                        onClick={() => setMode(nextMode)}
                                    >
                                        {nextMode}
                                    </button>
                                ))}
                            </div>
                            {mode === "preview" ? (
                                <button
                                    type="button"
                                    className="soft-button"
                                    onClick={() => setIsPreviewSidebarHidden((current) => !current)}
                                >
                                    {isPreviewSidebarHidden ? "Show sidebar" : "Hide sidebar"}
                                </button>
                            ) : null}
                        </div>
                    </header>

                    {mode === "edit" ? (
                        <div className="w-full max-w-[820px]">
                            <KeyboardView
                                config={viewerConfig}
                                layer={activeLayer}
                                selectedKeyId={selectedKeyId}
                                onSelectKey={setSelectedKeyId}
                                maxScale={1.08}
                                interactive
                            />
                        </div>
                    ) : (
                        <div
                            ref={previewRef}
                            className={`preview-grid ${previewUsesGrid ? "preview-grid--expanded" : "preview-grid--compact"}`}
                        >
                            {previewLayers.map((layer) => {
                                const index = viewerConfig.layers.findIndex((candidate) => candidate.id === layer.id)
                                return (
                                    <section key={layer.id} className="layer-preview-card">
                                        <div className="layer-preview-card__header">
                                            <h2>{compactLayerName(layer, index)}</h2>
                                            <span>{Object.values(layer.keys).filter((action) => action.label).length} assigned</span>
                                        </div>
                                        <KeyboardView config={viewerConfig} layer={layer} maxScale={1.12}/>
                                        <div className="layer-preview-card__footer">
                                            {layer.description ? <p>{layer.description}</p> : null}
                                        </div>
                                    </section>
                                )
                            })}
                            {viewerConfig.macros && viewerConfig.macros.length > 0 ? (
                                <section className="macro-preview-card">
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

                <aside className={`control-sidebar grid gap-3 lg:self-center print:hidden ${mode === "preview" && isPreviewSidebarHidden ? "hidden" : ""}`}>
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
                            <button
                                type="button"
                                className="rounded-md border border-rose-300/25 bg-rose-300/10 px-3 py-2 text-sm text-rose-100 transition hover:border-rose-300/45 hover:bg-rose-300/15"
                                onClick={clearPersistedConfig}
                            >
                                Delete saved local data
                            </button>
                            <p className="status-copy" role="status">{status}</p>
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
                                    onChange={(event) => updateSelectedLabel(event.target.value)}
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
                                {selectedAction?.legend ? <p className="mt-1 text-xs font-medium text-cyan-200/80">{selectedAction.legend}</p> : null}
                                <p className="mt-1 text-xs leading-relaxed">{describeAction(selectedAction)}</p>
                                {selectedAction?.metadata?.source ? (
                                    <code className="mt-2 block overflow-hidden text-ellipsis rounded bg-black/20 px-2 py-1 text-[10px] text-zinc-500">
                                        {String(selectedAction.metadata.source)}
                                    </code>
                                ) : null}
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
                        <div className="mb-3 grid grid-cols-3 gap-2 text-xs">
                            {viewerConfig.layers.map((layer, index) => {
                                const visible = previewLayerIds.includes(layer.id)
                                return (
                                    <button
                                        key={layer.id}
                                        type="button"
                                        className={`rounded-md border px-2 py-1.5 transition ${
                                            visible
                                                ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100"
                                                : "border-white/[0.06] bg-black/10 text-zinc-500"
                                        }`}
                                        onClick={() => togglePreviewLayer(layer.id)}
                                    >
                                        {compactLayerName(layer, index)}
                                    </button>
                                )
                            })}
                        </div>
                        <button
                            type="button"
                            className="mb-3 w-full rounded-md border border-white/[0.06] bg-black/10 px-3 py-2 text-sm text-zinc-300 transition hover:border-white/15 hover:bg-white/[0.04]"
                            onClick={showAllPreviewLayers}
                        >
                            Show all preview layers
                        </button>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <button type="button" className="rounded-md border border-white/[0.06] bg-black/10 px-3 py-2 text-zinc-300 transition hover:border-white/15 hover:bg-white/[0.04]" onClick={() => void exportPreviewImage()}>
                                PNG
                            </button>
                            <button type="button" className="rounded-md border border-white/[0.06] bg-black/10 px-3 py-2 text-zinc-300 transition hover:border-white/15 hover:bg-white/[0.04]" onClick={() => void exportPreviewPdf()}>
                                PDF
                            </button>
                        </div>
                    </Panel>
                </aside>
            </div>
        </main>
    )
}
