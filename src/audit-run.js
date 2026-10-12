import { AuditGateError } from "./errors.js";
import { GateStatus, VALID_STATUSES } from "./status.js";
import { deepFreeze, normalizeCheckResult, stableClone } from "./utils.js";

function makeRecord(name, status, details = {}) {
  if (typeof name !== "string" || name.trim() === "") {
    throw new TypeError("Gate name must be a non-empty string.");
  }
  if (!VALID_STATUSES.has(status)) {
    throw new TypeError(`Invalid gate status: ${status}`);
  }

  const record = { name, status };
  for (const key of ["actual", "expected", "message", "metadata"]) {
    if (details[key] !== undefined) record[key] = stableClone(details[key]);
  }
  return deepFreeze(record);
}

export class AuditRun {
  #records = [];
  #finalized = false;

  constructor({ name = "audit", failFast = false, metadata = {} } = {}) {
    if (typeof name !== "string" || name.trim() === "") {
      throw new TypeError("Audit name must be a non-empty string.");
    }
    this.name = name;
    this.failFast = Boolean(failFast);
    this.metadata = deepFreeze(stableClone(metadata));
  }

  get records() {
    return Object.freeze([...this.#records]);
  }

  get finalized() {
    return this.#finalized;
  }

  record(name, status, details = {}) {
    if (this.#finalized) throw new Error("AuditRun is finalized and cannot be modified.");
    const entry = makeRecord(name, status, details);
    this.#records.push(entry);
    if (this.failFast && (status === GateStatus.FAIL || status === GateStatus.ERROR)) {
      throw new AuditGateError(entry);
    }
    return entry;
  }

  pass(name, details = {}) {
    return this.record(name, GateStatus.PASS, details);
  }

  fail(name, details = {}) {
    return this.record(name, GateStatus.FAIL, details);
  }

  skip(name, details = {}) {
    return this.record(name, GateStatus.SKIP, details);
  }

  async check(name, check) {
    if (typeof check !== "function") throw new TypeError("check must be a function.");
    try {
      const output = normalizeCheckResult(await check());
      return this.record(name, output.passed ? GateStatus.PASS : GateStatus.FAIL, output);
    } catch (error) {
      if (error instanceof AuditGateError) throw error;
      const message = error instanceof Error ? error.message : String(error);
      return this.record(name, GateStatus.ERROR, { message });
    }
  }

  finalize() {
    if (this.#finalized) throw new Error("AuditRun has already been finalized.");
    this.#finalized = true;

    const totals = { PASS: 0, FAIL: 0, ERROR: 0, SKIP: 0 };
    for (const entry of this.#records) totals[entry.status] += 1;

    const status = totals.FAIL === 0 && totals.ERROR === 0 ? GateStatus.PASS : GateStatus.FAIL;
    return deepFreeze({
      schemaVersion: 1,
      name: this.name,
      status,
      metadata: stableClone(this.metadata),
      totals,
      records: this.#records.map((entry) => stableClone(entry)),
    });
  }
}

export function reportToJson(report, { space = 2 } = {}) {
  return `${JSON.stringify(report, null, space)}\n`;
}

export function reportToText(report) {
  const lines = [
    `AUDIT=${report.name}`,
    `STATUS=${report.status}`,
    `PASS=${report.totals.PASS}`,
    `FAIL=${report.totals.FAIL}`,
    `ERROR=${report.totals.ERROR}`,
    `SKIP=${report.totals.SKIP}`,
  ];
  for (const record of report.records) lines.push(`${record.name}=${record.status}`);
  return `${lines.join("\n")}\n`;
}
