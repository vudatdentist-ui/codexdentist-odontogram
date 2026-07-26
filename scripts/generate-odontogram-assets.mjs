import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageRoot = path.join(
  repoRoot,
  "node_modules",
  "@artidev",
  "odontogram-core",
);
const sourceDirectory = path.join(packageRoot, "assets", "teeth-svgs");
const outputDirectory = path.join(repoRoot, "public", "odontogram-assets");
const templates = ["11", "13", "14", "16"];
const markerLayers = {
  pulpitis: ["tooth-inflam-pulp", "milktooth-inflam-pulp"],
  rootCanal: ["endo-filling"],
  periodontitis: ["parodontal"],
  periapical: ["inflammation"],
  crown: ["zircon-crown"],
  extraction: ["extraction-plan"],
};

const primaryDentitionStyles = `
  <style id="codexdentist-primary-dentition">
    #tooth-base,
    #tooth-base-beauty,
    #tooth-healthy-pulp,
    #tooth-inflam-pulp,
    #tooth-bruxism-wear,
    #tooth-bruxism-neck-wear {
      display: none !important;
    }

    #milktooth,
    #milktooth-base,
    #milktooth-beauty,
    #milktooth-healthy-pulp {
      display: inline !important;
    }

    #milktooth-inflam-pulp {
      display: none !important;
    }
  </style>
`;

const implantStyles = `
  <style id="codexdentist-implant">
    #tooth,
    #milktooth,
    #endos,
    #surfaces,
    #restorations > * {
      display: none !important;
    }

    #implant,
    #implant-base,
    #implant-base *,
    #implant-healing-abutment,
    #implant-healing-abutment * {
      display: inline !important;
    }

    #implant > :not(#implant-base):not(#implant-healing-abutment) {
      display: none !important;
    }
  </style>
`;

const boneOnlyStyles = `
  <style id="codexdentist-bone-only">
    #tooth,
    #milktooth,
    #implant,
    #endos,
    #surfaces,
    #restorations,
    #mods {
      display: none !important;
    }

    #base,
    #base * {
      display: inline !important;
      visibility: visible !important;
    }
  </style>
`;

const boneLossStyles = `
  <style id="codexdentist-bone-loss">
    #base {
      transform-box: fill-box;
      transform-origin: center top;
      transform: scaleY(0.62);
    }
  </style>
`;

function markerLayerStyles(marker, ids) {
  const selectors = ids.map((id) => `#${id}`).join(",\n    ");
  const descendantSelectors = ids
    .map((id) => `#${id} *`)
    .join(",\n    ");

  return `
  <style id="codexdentist-marker-${marker}">
    #base,
    #tooth,
    #endos,
    #surfaces,
    #restorations {
      visibility: hidden !important;
    }

    ${selectors},
    ${descendantSelectors} {
      display: inline !important;
      visibility: visible !important;
    }
  </style>
`;
}

function injectStyles(svg, styles) {
  if (styles.length === 0) {
    return svg;
  }

  return svg.replace("<defs>", `${styles.join("\n")}\n  <defs>`);
}

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

for (const template of templates) {
  const sourcePath = path.join(sourceDirectory, `${template}.svg`);
  const svg = await readFile(sourcePath, "utf8");

  if (!svg.includes("<defs>")) {
    throw new Error(`Unexpected SVG structure: ${sourcePath}`);
  }

  const variants = [];

  for (const dentition of ["adult", "primary"]) {
    const dentitionStyles =
      dentition === "primary" ? [primaryDentitionStyles] : [];
    const baseName = `${template}-${dentition}`;

    variants.push(
      writeFile(
        path.join(outputDirectory, `${baseName}.svg`),
        injectStyles(svg, dentitionStyles),
        "utf8",
      ),
      writeFile(
        path.join(outputDirectory, `${baseName}-implant.svg`),
        injectStyles(svg, [...dentitionStyles, implantStyles]),
        "utf8",
      ),
      writeFile(
        path.join(outputDirectory, `${baseName}-bone.svg`),
        injectStyles(svg, [...dentitionStyles, boneOnlyStyles]),
        "utf8",
      ),
      writeFile(
        path.join(outputDirectory, `${baseName}-boneLoss.svg`),
        injectStyles(svg, [...dentitionStyles, boneLossStyles]),
        "utf8",
      ),
      writeFile(
        path.join(outputDirectory, `${baseName}-boneLossOnly.svg`),
        injectStyles(svg, [
          ...dentitionStyles,
          boneOnlyStyles,
          boneLossStyles,
        ]),
        "utf8",
      ),
      writeFile(
        path.join(outputDirectory, `${baseName}-implantBoneLoss.svg`),
        injectStyles(svg, [
          ...dentitionStyles,
          implantStyles,
          boneLossStyles,
        ]),
        "utf8",
      ),
    );

    for (const [marker, ids] of Object.entries(markerLayers)) {
      variants.push(
        writeFile(
          path.join(outputDirectory, `${baseName}-${marker}.svg`),
          injectStyles(svg, [
            ...dentitionStyles,
            markerLayerStyles(marker, ids),
          ]),
          "utf8",
        ),
      );
    }
  }

  await Promise.all(variants);
}

const license = await readFile(path.join(packageRoot, "LICENSE"), "utf8");
await writeFile(
  path.join(outputDirectory, "ARTIDEV-LICENSE.txt"),
  license,
  "utf8",
);
