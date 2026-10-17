// Workaround for an upstream React/Next.js dev-only bug:
// "Failed to execute 'measure' on 'Performance': '<Component>' cannot have a negative time stamp"
//
// Root cause: React's RSC dev performance instrumentation logs a Server Component
// "Errored"/"Aborted" measure using childrenEndTime which can be -Infinity when the
// render is aborted by a server-side redirect()/notFound(). performance.measure() then
// throws. The upstream fix guards the measure calls with `0 <= childrenEndTime`.
//
// This script applies that guard to the React Server Components client dev bundles that
// Next.js ships in node_modules/next/dist/compiled. It is idempotent and safe to run on
// every install (see the "postinstall" script). Remove this once the bundled React version
// includes the upstream fix.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const compiled = join(root, "node_modules", "next", "dist", "compiled");

const targets = [
  "react-server-dom-turbopack/cjs/react-server-dom-turbopack-client.browser.development.js",
  "react-server-dom-turbopack-experimental/cjs/react-server-dom-turbopack-client.browser.development.js",
  "react-server-dom-webpack/cjs/react-server-dom-webpack-client.browser.development.js",
  "react-server-dom-webpack-experimental/cjs/react-server-dom-webpack-client.browser.development.js",
];

const OPEN = "if (supportsUserTiming) {";
const END_RE = /end: (childrenEndTime\$jscomp\$\d+),/;

let patchedFiles = 0;

for (const rel of targets) {
  const file = join(compiled, rel);
  if (!existsSync(file)) continue;

  let source = readFileSync(file, "utf8");
  const edits = [];
  let cursor = 0;

  while (true) {
    const start = source.indexOf(OPEN, cursor);
    if (start === -1) break;
    cursor = start + OPEN.length;

    const windowText = source.slice(start, start + 4000);
    const endMatch = windowText.match(END_RE);
    if (endMatch) {
      edits.push({ start, end: start + OPEN.length, guard: endMatch[1] });
    }
  }

  if (edits.length === 0) continue;

  for (let i = edits.length - 1; i >= 0; i--) {
    const { start, end, guard } = edits[i];
    const replacement = `if (supportsUserTiming && 0 <= ${guard}) {`;
    source = source.slice(0, start) + replacement + source.slice(end);
  }

  writeFileSync(file, source);
  patchedFiles++;
  console.log(`patched ${rel} (${edits.length} guard${edits.length === 1 ? "" : "s"})`);
}

if (patchedFiles === 0) {
  console.log("patch-react-negative-timestamp: nothing to patch (already fixed or files not found)");
}
