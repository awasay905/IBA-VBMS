import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
    globalSetup: "./e2e/global-setup.ts",
    testDir: "./e2e",
    fullyParallel: false,
    retries: 1,
    timeout: 30_000,
    reporter: [["list"], ["html", { outputFolder: "./reports/playwright", open: "never" }]],
    use: {
        baseURL: "http://localhost:5173",
        headless: true,
        screenshot: "only-on-failure",
        video: "retain-on-failure",
        trace: "on-first-retry",
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
        {
            name: "firefox",
            use: { ...devices["Desktop Firefox"] },
        },
    ],
});
