import { cp, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(repoRoot, "public", "odontogram-assets");
const destination = path.join(repoRoot, "dist", "odontogram-assets");

await mkdir(destination, { recursive: true });
await cp(source, destination, { recursive: true });
