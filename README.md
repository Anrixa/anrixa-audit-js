# @anrixa/audit

Deterministic audit gates, immutable evidence reports, and SHA-256 verification for Node.js workflows.

## Install

```bash
npm install @anrixa/audit
```

Requires Node.js 22.14 or newer. The package has zero runtime dependencies.

## Library

```js
import { AuditRun, equals, sha256Matches } from "@anrixa/audit";

const audit = new AuditRun({ name: "release", failFast: false });

await audit.check("VERSION_GATE", () => equals("0.1.0", "0.1.0"));
await audit.check("ARTIFACT_SHA256_GATE", () =>
  sha256Matches("./artifact.bin", "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef")
);

const report = audit.finalize();
console.log(report);
```

A finalized report is immutable and contains deterministic status totals and gate records. No timestamp is injected automatically, so identical inputs can produce identical evidence.

## CLI

```bash
anrixa-audit --version
anrixa-audit hash ./artifact.bin
anrixa-audit verify ./artifact.bin <sha256>
anrixa-audit json ./report.json
```

`verify` exits with code `0` on a match and `1` on a mismatch. Usage or runtime errors exit with code `2`.

## Built-in checks

- `equals(actual, expected)`
- `countEquals(actual, expected)`
- `minimum(actual, minimum)`
- `maximum(actual, maximum)`
- `fileExists(path)`
- `fileSize(path, bytes)`
- `validJsonFile(path)`
- `sha256Matches(path, expectedSha256)`

## Evidence model

Every gate is one of:

- `PASS`
- `FAIL`
- `ERROR`
- `SKIP`

Checks distinguish a normal failed assertion (`FAIL`) from an exception while executing the check (`ERROR`).

## Release security

The repository is prepared for npm Trusted Publishing with GitHub Actions OIDC. npm Trusted Publishing requires a modern npm CLI and supported Node.js runtime; the release workflow upgrades npm before publishing.

## License

Apache-2.0
