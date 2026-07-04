import { defineConfig } from "@playwright/test";

export default defineConfig({
    testDir: "./tests/e2e",
    fullyParallel: true,
    timeout: 30_000,
    expect: {
        timeout: 5_000,
    },
    reporter: "list",
    use: {
        baseURL: "http://127.0.0.1:61001",
        trace: "on-first-retry",
    },
    webServer: {
        command: process.env.CI
            ? "npm --prefix website run serve -- --host 127.0.0.1 --port 61001 --no-open"
            : "npm --prefix website run start -- --host 127.0.0.1 --port 61001 --no-open",
        url: "http://127.0.0.1:61001",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        gracefulShutdown: { signal: "SIGTERM", timeout: 500 },
    },
});
