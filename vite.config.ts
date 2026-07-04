import { resolve } from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
    plugins: [
        react(),
        dts({
            outDirs: "dist",
            entryRoot: "src",
            include: ["src/**/*"],
            exclude: ["src/**/*.test.ts", "src/**/*.test.tsx"],
            bundleTypes: true,
        }),
    ],
    build: {
        lib: {
            entry: resolve(import.meta.dirname, "src/index.ts"),
            name: "SuperSelect",
            formats: ["es", "cjs"],
            fileName: (format) => (format === "es" ? "super-select-react.js" : "super-select-react.cjs"),
        },
        rolldownOptions: {
            external: ["react", "react-dom", "react/jsx-runtime"],
            output: {
                globals: {
                    react: "React",
                    "react-dom": "ReactDOM",
                },
            },
        },
    },
});
