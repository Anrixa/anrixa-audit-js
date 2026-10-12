export type GateStatusValue = "PASS" | "FAIL" | "ERROR" | "SKIP";

export const GateStatus: Readonly<{
  PASS: "PASS";
  FAIL: "FAIL";
  ERROR: "ERROR";
  SKIP: "SKIP";
}>;

export interface CheckResult {
  passed: boolean;
  actual?: unknown;
  expected?: unknown;
  message?: string;
  metadata?: Record<string, unknown>;
}

export interface GateRecord {
  name: string;
  status: GateStatusValue;
  actual?: unknown;
  expected?: unknown;
  message?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditReport {
  schemaVersion: 1;
  name: string;
  status: "PASS" | "FAIL";
  metadata: Record<string, unknown>;
  totals: Record<GateStatusValue, number>;
  records: GateRecord[];
}

export class AuditGateError extends Error {
  record: GateRecord;
  constructor(record: GateRecord);
}

export class AuditRun {
  constructor(options?: {
    name?: string;
    failFast?: boolean;
    metadata?: Record<string, unknown>;
  });
  readonly name: string;
  readonly failFast: boolean;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly records: readonly GateRecord[];
  readonly finalized: boolean;
  record(name: string, status: GateStatusValue, details?: Omit<GateRecord, "name" | "status">): GateRecord;
  pass(name: string, details?: Omit<GateRecord, "name" | "status">): GateRecord;
  fail(name: string, details?: Omit<GateRecord, "name" | "status">): GateRecord;
  skip(name: string, details?: Omit<GateRecord, "name" | "status">): GateRecord;
  check(name: string, check: () => boolean | CheckResult | Promise<boolean | CheckResult>): Promise<GateRecord>;
  finalize(): AuditReport;
}

export function reportToJson(report: AuditReport, options?: { space?: number }): string;
export function reportToText(report: AuditReport): string;
export function sha256File(path: string): Promise<string>;
export function isSha256(value: unknown): value is string;
export * from "./checks";
