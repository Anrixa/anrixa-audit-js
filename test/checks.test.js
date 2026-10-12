import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  countEquals,
  equals,
  fileExists,
  fileSize,
  isSha256,
  maximum,
  minimum,
  sha256File,
  sha256Matches,
  validJsonFile,
} from "../src/index.js";

test("primitive checks", () => {
  assert.equal(equals(1, 1).passed, true);
  assert.equal(equals(1, "1").passed, false);
  assert.equal(countEquals(3, 3).passed, true);
  assert.equal(minimum(4, 3).passed, true);
  assert.equal(maximum(4, 3).passed, false);
  assert.throws(() => countEquals(1.2, 1), TypeError);
});

test("file checks, JSON, and SHA-256", async () => {
  const dir = await mkdtemp(join(tmpdir(), "anrixa-audit-"));
  const jsonPath = join(dir, "sample.json");
  const badPath = join(dir, "bad.json");
  await writeFile(jsonPath, '{"ok":true}\n', "utf8");
  await writeFile(badPath, '{bad}\n', "utf8");

  assert.equal((await fileExists(jsonPath)).passed, true);
  assert.equal((await fileExists(join(dir, "missing"))).passed, false);
  assert.equal((await fileSize(jsonPath, 12)).passed, true);
  assert.equal((await validJsonFile(jsonPath)).passed, true);
  assert.equal((await validJsonFile(badPath)).passed, false);

  const digest = await sha256File(jsonPath);
  assert.equal(isSha256(digest), true);
  assert.equal((await sha256Matches(jsonPath, digest.toUpperCase())).passed, true);
  await assert.rejects(() => sha256Matches(jsonPath, "bad"), TypeError);
});
