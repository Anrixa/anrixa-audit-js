import test from "node:test";
import assert from "node:assert/strict";
import { AuditRun, AuditGateError, GateStatus, equals, reportToJson, reportToText } from "../src/index.js";

test("successful audit finalizes deterministically", async () => {
  const audit = new AuditRun({ name: "release", metadata: { z: 1, a: 2 } });
  await audit.check("VERSION_GATE", () => equals("0.1.0", "0.1.0"));
  audit.skip("OPTIONAL_GATE", { message: "not required" });
  const report = audit.finalize();
  assert.equal(report.status, GateStatus.PASS);
  assert.deepEqual(report.totals, { PASS: 1, FAIL: 0, ERROR: 0, SKIP: 1 });
  assert.deepEqual(Object.keys(report.metadata), ["a", "z"]);
  assert.throws(() => audit.pass("LATE"), /finalized/);
});

test("failed check produces FAIL record", async () => {
  const audit = new AuditRun();
  const record = await audit.check("COUNT_GATE", () => ({ passed: false, actual: 2, expected: 3 }));
  assert.equal(record.status, GateStatus.FAIL);
  assert.equal(audit.finalize().status, GateStatus.FAIL);
});

test("thrown check becomes ERROR record", async () => {
  const audit = new AuditRun();
  const record = await audit.check("BROKEN_GATE", () => { throw new Error("boom"); });
  assert.equal(record.status, GateStatus.ERROR);
  assert.equal(record.message, "boom");
});

test("fail-fast throws AuditGateError", () => {
  const audit = new AuditRun({ failFast: true });
  assert.throws(() => audit.fail("STOP_GATE"), AuditGateError);
});

test("fail-fast check rejects with AuditGateError", async () => {
  const audit = new AuditRun({ failFast: true });
  await assert.rejects(
    audit.check("ASYNC_STOP_GATE", () => ({ passed: false })),
    AuditGateError,
  );
  assert.equal(audit.records.length, 1);
  assert.equal(audit.records[0].status, GateStatus.FAIL);
});

test("record values are immutable snapshots", () => {
  const source = { b: 2, a: { x: 1 } };
  const audit = new AuditRun();
  const record = audit.pass("SNAPSHOT_GATE", { metadata: source });
  source.a.x = 9;
  assert.equal(record.metadata.a.x, 1);
  assert.equal(Object.isFrozen(record), true);
});

test("JSON and text reports have stable terminal newlines", () => {
  const audit = new AuditRun({ name: "x" });
  audit.pass("A");
  const report = audit.finalize();
  assert.match(reportToJson(report), /\n$/);
  assert.equal(reportToText(report), "AUDIT=x\nSTATUS=PASS\nPASS=1\nFAIL=0\nERROR=0\nSKIP=0\nA=PASS\n");
});
