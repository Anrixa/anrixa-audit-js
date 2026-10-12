export const GateStatus = Object.freeze({
  PASS: "PASS",
  FAIL: "FAIL",
  ERROR: "ERROR",
  SKIP: "SKIP",
});

export const VALID_STATUSES = Object.freeze(new Set(Object.values(GateStatus)));
