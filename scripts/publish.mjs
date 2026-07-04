import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const rootDir = process.cwd();
const rootPackageJsonPath = path.join(rootDir, "package.json");
const publishArgs = ["publish", "--access", "public", "--provenance"];
const isCheckOnly = process.argv.includes("--check");

const rootPackageJson = JSON.parse(await fs.readFile(rootPackageJsonPath, "utf8"));

if (isCheckOnly) {
    console.log(`Publish check passed: ready to publish ${rootPackageJson.name}@${rootPackageJson.version}.`);
    process.exit(0);
}

console.log(`Publishing ${rootPackageJson.name}@${rootPackageJson.version}...`);
const publishResult = spawnSync("npm", publishArgs, {
    cwd: rootDir,
    stdio: "inherit",
    shell: process.platform === "win32",
});

if (publishResult.status !== 0) {
    process.exit(publishResult.status ?? 1);
}
