import { AuditRun, equals, sha256Matches } from "@anrixa/audit";

const audit = new AuditRun({ name: "release" });
await audit.check("VERSION_GATE", () => equals("0.1.0", "0.1.0"));
// await audit.check("ARTIFACT_SHA256_GATE", () => sha256Matches("./dist/file.tgz", "..."));
console.log(audit.finalize());
