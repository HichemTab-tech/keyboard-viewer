import {existsSync} from "node:fs"
import {defineConfig} from "@playwright/test"

const systemChromium = "/usr/bin/chromium"

export default defineConfig({
    testDir: "./e2e",
    fullyParallel: true,
    reporter: "line",
    use: {
        baseURL: "http://127.0.0.1:4173",
        colorScheme: "dark",
        launchOptions: existsSync(systemChromium) ? {executablePath: systemChromium} : undefined,
        screenshot: "only-on-failure",
    },
    webServer: {
        command: "./node_modules/.bin/vite --host 127.0.0.1 --port 4173",
        url: "http://127.0.0.1:4173",
        reuseExistingServer: true,
    },
})
