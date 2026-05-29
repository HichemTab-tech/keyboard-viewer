import {useEffect, useState, type CSSProperties} from "react"

type KeyConfig = {
    x: number
    y: number
    labelIndex: number
    w?: number
    h?: number
    rotation?: number
    highlighted?: boolean
    pressed?: boolean
    legend?: string
}

const labels = [
    "A",
    "B",
    "(",
    ")",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
]

const unit = 44
const gap = 7
const leftOrigin = {x: 0, y: 0}
const rightOrigin = {x: 418, y: -6}

const leftMainKeys: KeyConfig[] = [
    {x: 0, y: 0, labelIndex: 0},
    {x: 1, y: 0, labelIndex: 1},
    {x: 2, y: -0.25, labelIndex: 2},
    {x: 3, y: -0.38, labelIndex: 3},
    {x: 4, y: -0.25, labelIndex: 4},
    {x: 5, y: -0.12, labelIndex: 5},
    {x: 0, y: 1, labelIndex: 6},
    {x: 1, y: 1, labelIndex: 7},
    {x: 2, y: 0.78, labelIndex: 8},
    {x: 3, y: 0.66, labelIndex: 9},
    {x: 4, y: 0.78, labelIndex: 10},
    {x: 5, y: 0.9, labelIndex: 11},
    {x: 0, y: 2, labelIndex: 12},
    {x: 1, y: 2, labelIndex: 13},
    {x: 2, y: 1.82, labelIndex: 14},
    {x: 3, y: 1.7, labelIndex: 15},
    {x: 4, y: 1.82, labelIndex: 16},
    {x: 5, y: 1.95, labelIndex: 17},
    {x: 6.05, y: 0.42, labelIndex: 18},
    {x: 6.05, y: 1.42, labelIndex: 19},
]

const leftThumbKeys: KeyConfig[] = [
    {x: 3.55, y: 3.04, labelIndex: 20},
    {x: 4.55, y: 3.08, labelIndex: 21, rotation: 15},
    {x: 5.55, y: 3.12, labelIndex: 22, w: 0.92, h: 1.42, rotation: 29},
]

const rightMainKeys: KeyConfig[] = leftMainKeys.map((key, index) => ({
    ...key,
    x: 6.05 - key.x,
    y: key.y,
    labelIndex: 26 + index,
}))

const rightThumbKeys: KeyConfig[] = [
    {x: 1.26, y: 3.14, labelIndex: 46, w: 0.92, h: 1.42, rotation: -29},
    {x: 2.26, y: 3.1, labelIndex: 47, rotation: -15},
    {x: 3.26, y: 3.05, labelIndex: 48},
]

const leftKeys = [...leftMainKeys, ...leftThumbKeys]
const rightKeys = [...rightMainKeys, ...rightThumbKeys]

type KeyProps = {
    keyData: KeyConfig
    origin: {x: number; y: number}
}

function Key({keyData, origin}: KeyProps) {
    const width = unit * (keyData.w ?? 1)
    const height = unit * (keyData.h ?? 1)
    const label = labels[keyData.labelIndex] ?? ""

    return (
        <div
            className="absolute grid place-items-center rounded-[5px] border border-white/[0.055] bg-[#343434]/85 text-[11px] font-medium text-zinc-500 shadow-[inset_0_0_0_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.035),0_1px_0_rgba(255,255,255,0.025)] transition duration-200 ease-out hover:-translate-y-0.5 hover:border-white/10 hover:bg-[#3d3d3d] hover:text-zinc-300 data-[highlighted=true]:border-teal-300/40 data-[highlighted=true]:bg-teal-400/15 data-[pressed=true]:translate-y-px data-[pressed=true]:bg-[#262626]"
            data-highlighted={keyData.highlighted ? "true" : undefined}
            data-pressed={keyData.pressed ? "true" : undefined}
            style={{
                left: origin.x + keyData.x * (unit + gap),
                top: origin.y + keyData.y * (unit + gap),
                width,
                height,
                transform: `rotate(${keyData.rotation ?? 0}deg)`,
            }}
        >
            <span className="leading-none">{label}</span>
            {keyData.legend ? (
                <span className="absolute bottom-1 right-1 text-[8px] uppercase tracking-wide text-zinc-600">
                    {keyData.legend}
                </span>
            ) : null}
        </div>
    )
}

function KeyboardHalf({keys, origin}: {keys: KeyConfig[]; origin: {x: number; y: number}}) {
    return keys.map((keyData) => (
        <Key key={`${origin.x}-${keyData.x}-${keyData.y}-${keyData.labelIndex}`} keyData={keyData} origin={origin}/>
    ))
}

export default function Home() {
    const [keyboardScale, setKeyboardScale] = useState(1)

    useEffect(() => {
        const updateScale = () => {
            setKeyboardScale(Math.min(1, Math.max(0.42, (window.innerWidth - 32) / 760)))
        }

        updateScale()
        window.addEventListener("resize", updateScale)

        return () => window.removeEventListener("resize", updateScale)
    }, [])

    const frameStyle: CSSProperties = {
        width: 760 * keyboardScale,
        height: 284 * keyboardScale,
    }
    const keyboardStyle: CSSProperties = {
        transform: `scale(${keyboardScale})`,
        transformOrigin: "top left",
    }

    return (
        <main className="min-h-screen overflow-hidden bg-[#404040] text-zinc-200">
            <div className="flex min-h-screen items-center justify-center px-4">
                <div style={frameStyle}>
                    <div className="relative h-[284px] w-[760px]" style={keyboardStyle}>
                        <KeyboardHalf keys={leftKeys} origin={leftOrigin}/>
                        <KeyboardHalf keys={rightKeys} origin={rightOrigin}/>
                    </div>
                </div>
            </div>
        </main>
    )
}
