import { access, readFile, stat } from "node:fs/promises";
import { constants } from "node:fs";
import { sha256File, isSha256 } from "./hash.js";

function result(passed, { actual, expected, message, metadata } = {}) {
  return { passed, actual, expected, message, metadata };
}

export function equals(actual, expected) {
  return result(Object.is(actual, expected), { actual, expected });
}

export function countEquals(actual, expected) {
  if (!Number.isInteger(actual) || !Number.isInteger(expected)) {
    throw new TypeError("countEquals requires integer values.");
  }
  return result(actual === expected, { actual, expected });
}

export function minimum(actual, expectedMinimum) {
  if (typeof actual !== "number" || typeof expectedMinimum !== "number") {
    throw new TypeError("minimum requires numeric values.");
  }
  return result(actual >= expectedMinimum, {
    actual,
    expected: { minimum: expectedMinimum },
  });
}

export function maximum(actual, expectedMaximum) {
  if (typeof actual !== "number" || typeof expectedMaximum !== "number") {
    throw new TypeError("maximum requires numeric values.");
  }
  return result(actual <= expectedMaximum, {
    actual,
    expected: { maximum: expectedMaximum },
  });
}

export async function fileExists(path) {
  try {
    await access(path, constants.F_OK);
    return result(true, { actual: path, expected: "exists" });
  } catch {
    return result(false, { actual: path, expected: "exists", message: "File does not exist." });
  }
}

export async function fileSize(path, expectedBytes) {
  if (!Number.isInteger(expectedBytes) || expectedBytes < 0) {
    throw new TypeError("expectedBytes must be a non-negative integer.");
  }
  const info = await stat(path);
  return result(info.size === expectedBytes, {
    actual: info.size,
    expected: expectedBytes,
    metadata: { path },
  });
}

export async function validJsonFile(path) {
  try {
    const text = await readFile(path, "utf8");
    JSON.parse(text);
    return result(true, { actual: path, expected: "valid JSON" });
  } catch (error) {
    return result(false, {
      actual: path,
      expected: "valid JSON",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function sha256Matches(path, expectedSha256) {
  if (!isSha256(expectedSha256)) {
    throw new TypeError("expectedSha256 must be a 64-character hexadecimal SHA-256 digest.");
  }
  const actual = await sha256File(path);
  return result(actual.toLowerCase() === expectedSha256.toLowerCase(), {
    actual,
    expected: expectedSha256.toLowerCase(),
    metadata: { path },
  });
}
