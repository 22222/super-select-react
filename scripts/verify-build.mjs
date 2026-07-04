import fs from "node:fs/promises";
import path from "node:path";

const distDir = path.join(process.cwd(), "dist");

await Promise.all(
    ["super-select-react.js", "super-select-react.cjs", "super-select-react.css", "super-select-react.d.ts"].map((fileName) =>
        fs.access(path.join(distDir, fileName)),
    ),
);

const declarations = await fs.readFile(path.join(distDir, "super-select-react.d.ts"), "utf8");

for (const expectedDeclaration of [
    "export declare function SuperSelect",
    "export declare function ModalSelect",
    "export declare function OptionListSelect",
    "export declare function ToggleButtonSelect",
    "export declare class OptionSource",
]) {
    if (!declarations.includes(expectedDeclaration)) {
        throw new Error(`Declaration bundle is missing ${expectedDeclaration}.`);
    }
}

console.log("Package build output verified.");
