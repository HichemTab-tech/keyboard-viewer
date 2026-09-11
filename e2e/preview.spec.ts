import path from "node:path"
import {expect, test} from "@playwright/test"

const fixture = path.resolve("tests/fixtures/wip-regression.vil")
const previewScenarios = [
    {width: 1280, columns: 1},
    {width: 2048, columns: 2},
    {width: 2560, columns: 3},
]

for (const scenario of previewScenarios) {
    test(`semantic legends stay inside a ${scenario.columns}-column preview at ${scenario.width}px`, async ({page}) => {
        await page.setViewportSize({width: scenario.width, height: 900})
        await page.goto("/")
        await page.locator('input[type="file"]').setInputFiles(fixture)
        await page.getByRole("button", {name: "preview", exact: true}).click()
        await page.getByRole("button", {name: "Hide sidebar"}).click()

        await expect(page.getByText("Hold · M1", {exact: true})).toBeVisible()
        await expect(page.getByText("GUI + V", {exact: true})).toBeVisible()

        const cards = page.locator("section").filter({has: page.getByRole("heading", {name: /^M\d+$/})})
        await expect(cards).toHaveCount(5)

        const measurements = await cards.evaluateAll((elements) => elements.map((element) => {
            const card = element.getBoundingClientRect()
            const frame = element.querySelector("[data-keyboard-frame]")?.getBoundingClientRect()
            const keyboard = element.querySelector("[data-keyboard-canvas]")?.getBoundingClientRect()
            const keys = [...element.querySelectorAll<HTMLElement>("[data-key-id]")].map((key) => key.getBoundingClientRect())
            return {
                top: Math.round(card.top),
                clientWidth: element.clientWidth,
                scrollWidth: element.scrollWidth,
                keyboardLeft: keyboard?.left,
                keyboardRight: keyboard?.right,
                cardLeft: card.left,
                cardRight: card.right,
                frameTop: frame?.top,
                frameBottom: frame?.bottom,
                firstKeyTop: Math.min(...keys.map((key) => key.top)),
                lastKeyBottom: Math.max(...keys.map((key) => key.bottom)),
            }
        }))

        const documentWidths = await page.evaluate(() => ({
            client: document.documentElement.clientWidth,
            scroll: document.documentElement.scrollWidth,
        }))
        expect(documentWidths.scroll).toBeLessThanOrEqual(documentWidths.client)
        for (const measurement of measurements) {
            expect(measurement.scrollWidth).toBeLessThanOrEqual(measurement.clientWidth)
            expect(measurement.keyboardLeft).toBeGreaterThanOrEqual(measurement.cardLeft)
            expect(measurement.keyboardRight).toBeLessThanOrEqual(measurement.cardRight)
            expect(measurement.firstKeyTop).toBeGreaterThanOrEqual(measurement.frameTop)
            expect(measurement.lastKeyBottom).toBeLessThanOrEqual(measurement.frameBottom)
        }

        expect(new Set(measurements.slice(0, scenario.columns).map(({top}) => top)).size).toBe(1)
        if (measurements.length > scenario.columns) {
            expect(measurements[scenario.columns].top).toBeGreaterThan(measurements[0].top)
        }
    })
}

test("editing an imported description preserves its tap-hold behavior", async ({page}) => {
    await page.goto("/")
    await page.locator('input[type="file"]').setInputFiles(fixture)
    await page.locator('[data-key-id="LT2"]').click()
    await page.getByLabel("Key description").fill("My layer-tap key")

    const key = page.locator('[data-key-id="LT2"]')
    await expect(key.getByText("Space", {exact: true})).toBeVisible()
    await expect(key.getByText("Hold · M1", {exact: true})).toBeVisible()
    await expect(key).toHaveAttribute("title", "My layer-tap key")
})
