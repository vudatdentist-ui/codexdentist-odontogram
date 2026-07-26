#!/usr/bin/env node

import { cp, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const source = path.join(packageRoot, "dist", "odontogram-assets");
const target = path.resolve(process.argv[2] || "public/odontogram-assets");

await mkdir(target, { recursive: true });
await cp(source, target, { recursive: true });
console.log(`Copied odontogram assets to ${target}`);
