import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const roots = ["src", "bin", "test", "scripts"];
let failures = 0;

async function walk(path) {
  const entries = await readdir(path, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(path, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (/\.(m?js)$/.test(entry.name)) {
      const text = await readFile(full, "utf8");
      const lines = text.split("\n");
      for (let index = 0; index < lines.length; index += 1) {
        if (/[ \t]+$/.test(lines[index])) {
          console.error(`${full}:${index + 1}: trailing whitespace`);
          failures += 1;
        }
      }
      if (text.includes("\r")) {
        console.error(`${full}: CR line ending detected`);
        failures += 1;
      }
    }
  }
}

for (const root of roots) await walk(root);
if (failures) process.exit(1);
console.log("LINT_GATE=PASS");
