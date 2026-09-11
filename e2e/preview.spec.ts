import path from "node:path"
import {expect, test} from "@playwright/test"

const fixture = path.resolve("tests/fixtures/wip-regression.vil")

test("semantic legends stay inside a two-column preview at 2048px", async ({page}) => {
    await page.setViewportSize({width: 2048, height: 900})
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
        const keyboard = element.querySelector("[data-keyboard-canvas]")?.getBoundingClientRect()
        return {
            clientWidth: element.clientWidth,
            scrollWidth: element.scrollWidth,
            keyboardLeft: keyboard?.left,
            keyboardRight: keyboard?.right,
            cardLeft: card.left,
            cardRight: card.right,
        }
    }))

    for (const measurement of measurements) {
        expect(measurement.scrollWidth).toBeLessThanOrEqual(measurement.clientWidth)
        expect(measurement.keyboardLeft).toBeGreaterThanOrEqual(measurement.cardLeft)
        expect(measurement.keyboardRight).toBeLessThanOrEqual(measurement.cardRight)
    }

    const first = await cards.nth(0).boundingBox()
    const third = await cards.nth(2).boundingBox()
    expect(first).not.toBeNull()
    expect(third).not.toBeNull()
    expect(third!.y).toBeGreaterThan(first!.y)
})
