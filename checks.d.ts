import type { CheckResult } from "./index";
export function equals(actual: unknown, expected: unknown): CheckResult;
export function countEquals(actual: number, expected: number): CheckResult;
export function minimum(actual: number, expectedMinimum: number): CheckResult;
export function maximum(actual: number, expectedMaximum: number): CheckResult;
export function fileExists(path: string): Promise<CheckResult>;
export function fileSize(path: string, expectedBytes: number): Promise<CheckResult>;
export function validJsonFile(path: string): Promise<CheckResult>;
export function sha256Matches(path: string, expectedSha256: string): Promise<CheckResult>;
