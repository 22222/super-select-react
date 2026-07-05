import fs from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const rootPackageJsonPath = path.join(rootDir, "package.json");
const rootPackageLockPath = path.join(rootDir, "package-lock.json");
const websitePackageLockPath = path.join(rootDir, "website", "package-lock.json");

const semverPattern = /^\d+\.\d+\.\d+$/;
const supportedInputs = ["sync", "patch", "minor", "major", "<x.y.z>"];

const [, , input] = process.argv;

if (!input) {
    console.error(`Usage: node scripts/version.mjs <${supportedInputs.join("|")}>`);
    process.exit(1);
}

const rootPackageJson = JSON.parse(await fs.readFile(rootPackageJsonPath, "utf8"));
const currentVersion = rootPackageJson.version;
const nextVersion = resolveNextVersion(currentVersion, input);

rootPackageJson.version = nextVersion;
await writeJson(rootPackageJsonPath, rootPackageJson);

const rootPackageLock = JSON.parse(await fs.readFile(rootPackageLockPath, "utf8"));
rootPackageLock.version = nextVersion;
if (rootPackageLock.packages?.[""]) {
    rootPackageLock.packages[""].version = nextVersion;
}
await writeJson(rootPackageLockPath, rootPackageLock);

const websitePackageLock = JSON.parse(await fs.readFile(websitePackageLockPath, "utf8"));
if (websitePackageLock.packages?.[".."]) {
    websitePackageLock.packages[".."].version = nextVersion;
    await writeJson(websitePackageLockPath, websitePackageLock);
}

console.log(`Synchronized release version: ${currentVersion} -> ${nextVersion}`);

function resolveNextVersion(currentVersion, input) {
    if (input === "sync") {
        return currentVersion;
    }

    if (semverPattern.test(input)) {
        return input;
    }

    const parts = currentVersion.split(".").map((part) => Number.parseInt(part, 10));
    if (parts.length !== 3 || parts.some(Number.isNaN)) {
        throw new Error(`Unsupported current version: ${currentVersion}`);
    }

    const [major, minor, patch] = parts;

    switch (input) {
        case "patch":
            return `${major}.${minor}.${patch + 1}`;
        case "minor":
            return `${major}.${minor + 1}.0`;
        case "major":
            return `${major + 1}.0.0`;
        default:
            throw new Error(`Unsupported version input: ${input}. Supported: ${supportedInputs.join(", ")}`);
    }
}

async function writeJson(filePath, value) {
    await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}
