export class AuditGateError extends Error {
  constructor(record) {
    super(`Audit gate failed: ${record.name} (${record.status})`);
    this.name = "AuditGateError";
    this.record = record;
  }
}
