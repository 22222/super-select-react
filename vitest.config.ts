import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        globals: true,
        environment: "node",
        exclude: ["tests/e2e/**", "tests/visual/**", "**/node_modules/**", "**/.git/**"],
    },
});
