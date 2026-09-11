import type {KeyboardAction} from "../keyboardConfig"

function TransparentIcon() {
    return (
        <svg aria-hidden="true" className="key-legend__transparent" viewBox="0 0 16 16" fill="none">
            <path d="M4.5 5.5h7L8 10.5l-3.5-5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
        </svg>
    )
}

export function KeyLegend({action}: {action?: KeyboardAction}) {
    if (!action) {
        return null
    }

    if (action.type === "special" && action.value === "transparent") {
        return <TransparentIcon/>
    }

    if (!action.label) {
        return null
    }

    const densityClass = action.label.length > 8 ? "key-legend--dense" : ""
    const soloClass = action.legend ? "" : "key-legend--solo"

    return (
        <span className={`key-legend ${densityClass} ${soloClass}`.trim()}>
            <span className="key-legend__primary">{action.label}</span>
            {action.legend ? <span className="key-legend__secondary">{action.legend}</span> : null}
        </span>
    )
}
