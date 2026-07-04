import { defineConfig } from "@playwright/test";

export default defineConfig({
    testDir: "./tests/visual",
    timeout: 30_000,
    expect: {
        timeout: 5_000,
        toHaveScreenshot: {
            maxDiffPixelRatio: 0.01,
        },
    },
    reporter: "list",
    use: {
        baseURL: "http://127.0.0.1:61001",
        colorScheme: "light",
        deviceScaleFactor: 1,
        viewport: { width: 1280, height: 900 },
        trace: "on-first-retry",
    },
    webServer: {
        command: "npm --prefix website run start -- --host 127.0.0.1 --port 61001 --no-open",
        url: "http://127.0.0.1:61001",
        reuseExistingServer: true,
        timeout: 120_000,
    },
});
