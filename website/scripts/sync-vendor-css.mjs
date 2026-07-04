import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const websiteRoot = resolve(scriptDir, "..");

const files = [
    {
        from: resolve(websiteRoot, "node_modules/bootstrap/dist/css/bootstrap.min.css"),
        to: resolve(websiteRoot, "static/vendor/bootstrap.min.css"),
    },
    {
        from: resolve(websiteRoot, "node_modules/@mantine/core/styles.css"),
        to: resolve(websiteRoot, "static/vendor/mantine-core.css"),
    },
];

await mkdir(resolve(websiteRoot, "static/vendor"), { recursive: true });

for (const file of files) {
    await copyFile(file.from, file.to);
}
