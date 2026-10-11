import { readFileSync, writeFileSync } from "node:fs";

const payload = JSON.parse(readFileSync("scripts/tmp-messages.json", "utf8"));

for (const [locale, namespaces] of Object.entries(payload)) {
  const file = `src/messages/${locale}.json`;
  const json = JSON.parse(readFileSync(file, "utf8"));
  for (const [namespace, entries] of Object.entries(namespaces)) {
    json[namespace] = { ...json[namespace], ...entries };
  }
  writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`);
  console.log("updated", file);
}