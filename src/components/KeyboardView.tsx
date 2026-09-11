import {useEffect, useRef, useState, type CSSProperties} from "react"
import type {KeyboardAction, KeyboardConfiguration, KeyboardLayer, LayoutKey} from "../keyboardConfig"
import {KeyLegend} from "./KeyLegend"

const centerGuideKeyIds = new Set(["L11", "L12", "L13", "L14", "R11", "R12", "R13", "R14"])

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
    const style: CSSProperties = {
        left: origin.x + layoutKey.x * (unit + gap),
        top: origin.y + layoutKey.y * (unit + gap),
        width: unit * (layoutKey.w ?? 1),
        height: unit * (layoutKey.h ?? 1),
        transform: `rotate(${layoutKey.rotation ?? 0}deg)`,
    }
    const className = [
        "keyboard-key",
        `keyboard-key--${action?.type ?? "empty"}`,
        centerGuideKeyIds.has(layoutKey.id) ? "keyboard-key--home" : "",
        selected ? "keyboard-key--selected" : "",
        interactive ? "keyboard-key--interactive" : "",
    ].filter(Boolean).join(" ")
    const title = action?.description ?? "No action assigned."
    const content = <KeyLegend action={action}/>

    if (!interactive) {
        return <div className={className} data-key-id={layoutKey.id} style={style} title={title}>{content}</div>
    }

    return (
        <button
            type="button"
            aria-label={`${layoutKey.id}: ${action?.label || "empty"}`}
            className={className}
            data-key-id={layoutKey.id}
            onClick={onSelect}
            style={style}
            title={title}
        >
            {content}
        </button>
    )
}

type KeyboardViewProps = {
    config: KeyboardConfiguration
    layer: KeyboardLayer
    selectedKeyId?: string
    onSelectKey?: (keyId: string) => void
    maxScale?: number
    interactive?: boolean
}

export function KeyboardView({config, layer, selectedKeyId, onSelectKey, maxScale = 1, interactive = false}: KeyboardViewProps) {
    const frameRef = useRef<HTMLDivElement>(null)
    const [frameWidth, setFrameWidth] = useState(config.layout.width * maxScale)

    useEffect(() => {
        const frame = frameRef.current
        if (!frame) {
            return
        }

        const updateWidth = () => setFrameWidth(frame.clientWidth)
        updateWidth()

        const observer = new ResizeObserver(updateWidth)
        observer.observe(frame)
        return () => observer.disconnect()
    }, [])

    const scale = Math.min(maxScale, frameWidth / config.layout.width)
    const renderedWidth = config.layout.width * scale
    const renderedHeight = config.layout.height * scale
    const canvasStyle: CSSProperties = {
        width: config.layout.width,
        height: config.layout.height,
        marginLeft: Math.max(0, (frameWidth - renderedWidth) / 2),
        transform: `scale(${scale})`,
        transformOrigin: "top left",
    }

    return (
        <div
            ref={frameRef}
            className="keyboard-frame"
            data-keyboard-frame
            style={{height: renderedHeight}}
        >
            <div className="keyboard-canvas" data-keyboard-canvas style={canvasStyle}>
                {config.layout.halves.flatMap((half) => half.keys.map((layoutKey) => (
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
                )))}
            </div>
        </div>
    )
}
