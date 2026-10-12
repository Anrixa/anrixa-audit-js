#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import process from "node:process";
import { sha256File, sha256Matches, validJsonFile } from "../src/index.js";

const VERSION = "0.1.0";

function usage() {
  return `anrixa-audit ${VERSION}\n\nUsage:\n  anrixa-audit --version\n  anrixa-audit hash <file>\n  anrixa-audit verify <file> <sha256>\n  anrixa-audit json <file>\n`;
}

async function main(argv) {
  const [command, ...args] = argv;

  if (command === "--version" || command === "-v") {
    console.log(`anrixa-audit ${VERSION}`);
    return 0;
  }
  if (command === "--help" || command === "-h" || command === undefined) {
    process.stdout.write(usage());
    return 0;
  }

  if (command === "hash" && args.length === 1) {
    console.log(await sha256File(args[0]));
    return 0;
  }

  if (command === "verify" && args.length === 2) {
    const outcome = await sha256Matches(args[0], args[1]);
    console.log(outcome.passed ? "PASS" : "FAIL");
    return outcome.passed ? 0 : 1;
  }

  if (command === "json" && args.length === 1) {
    const outcome = await validJsonFile(args[0]);
    if (outcome.passed) {
      const parsed = JSON.parse(await readFile(args[0], "utf8"));
      console.log(JSON.stringify(parsed));
      return 0;
    }
    console.error(outcome.message ?? "Invalid JSON");
    return 1;
  }

  process.stderr.write(usage());
  return 2;
}

try {
  process.exitCode = await main(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 2;
}
