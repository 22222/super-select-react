import fs from "node:fs/promises";
import path from "node:path";

const ignoredDirectories = new Set([".docusaurus", ".git", "build", "dist", "node_modules"]);
const filesWithCrlf = [];

await checkDirectory(process.cwd());

if (filesWithCrlf.length > 0) {
    console.error("Files must use LF line endings:");
    for (const file of filesWithCrlf) {
        console.error(`- ${file}`);
    }
    process.exit(1);
}

console.log("Line endings verified.");

async function checkDirectory(directory) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            if (!ignoredDirectories.has(entry.name)) {
                await checkDirectory(path.join(directory, entry.name));
            }
            continue;
        }

        if (!entry.isFile()) {
            continue;
        }

        const filePath = path.join(directory, entry.name);
        const contents = await fs.readFile(filePath);
        if (contents.includes(0)) {
            continue;
        }

        for (let index = 0; index < contents.length - 1; index++) {
            if (contents[index] === 13 && contents[index + 1] === 10) {
                filesWithCrlf.push(path.relative(process.cwd(), filePath));
                break;
            }
        }
    }
}
