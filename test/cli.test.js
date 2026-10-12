import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const execFileAsync = promisify(execFile);
const here = dirname(fileURLToPath(import.meta.url));
const cli = join(here, "..", "bin", "anrixa-audit.js");

test("CLI reports version", async () => {
  const { stdout } = await execFileAsync(process.execPath, [cli, "--version"]);
  assert.equal(stdout.trim(), "anrixa-audit 0.1.0");
});

test("CLI help is available", async () => {
  const { stdout } = await execFileAsync(process.execPath, [cli, "--help"]);
  assert.match(stdout, /Usage:/);
});
