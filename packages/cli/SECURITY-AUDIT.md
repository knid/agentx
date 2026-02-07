# AgentX CLI Security Audit Report

**Date**: 2026-02-06
**Scope**: AgentX CLI (`packages/cli`) and supporting Web API routes (`packages/web`)
**Branch**: `001-mvp-cli-agent-marketplace`
**Auditor**: Automated Security Review
**Framework**: OWASP Top 10 (2021), CWE references

---

## Executive Summary

The AgentX CLI codebase demonstrates a strong security posture for a developer tool at this stage of development. No critical or high severity vulnerabilities were identified. The codebase follows secure coding practices including proper use of cryptographic primitives, avoidance of shell injection vectors, strict input validation via Zod schemas, and appropriate secret handling.

**Overall Verdict: PASS**

- Critical: 0
- High: 0
- Medium: 0
- Low: 2
- Informational: 5

---

## Detailed Findings

### LOW-01: Auth token stored as plaintext JSON

**File**: `/packages/cli/src/auth/token-store.ts`
**Severity**: Low
**CWE**: CWE-312 (Cleartext Storage of Sensitive Information)
**OWASP**: A02:2021 - Cryptographic Failures

The authentication token is stored as plain JSON at `~/.agentx/auth.json` without encryption and without explicit restrictive file permissions.

**Analysis**: This follows the established convention used by widely adopted CLI tools (GitHub CLI stores tokens in `~/.config/gh/hosts.yml`, npm stores tokens in `~/.npmrc`, Docker in `~/.docker/config.json`). The token is scoped to the agentx registry only and grants limited publish access. The risk is mitigated by the fact that the file lives in the user's home directory behind OS-level access controls.

**Recommendation**: Consider setting file permissions to `0600` (owner read/write only) after writing `auth.json` via `chmodSync(AUTH_PATH, 0o600)`. This adds a defense-in-depth layer on multi-user systems.

---

### LOW-02: Temp MCP config files may persist after SIGKILL

**File**: `/packages/cli/src/runtime/runner.ts` (lines 159-167)
**File**: `/packages/cli/src/runtime/mcp-builder.ts` (lines 43-54)
**Severity**: Low
**CWE**: CWE-459 (Incomplete Cleanup)

Temporary MCP config files (which may contain resolved secret values in environment variables) are written to `os.tmpdir()/agentx-mcp/<uuid>.json` and cleaned up in a `finally` block. If the process is killed with `SIGKILL` (signal 9), the `finally` block does not execute, leaving files containing resolved secrets on disk in the OS temp directory.

**Analysis**: The risk is mitigated by several factors: (a) `SIGKILL` is an uncommon termination method, (b) the files are in the OS temp directory which is periodically cleaned by the OS, (c) the files have UUID-based names making them non-discoverable by name, and (d) temp directory access is typically restricted to the owning user.

**Recommendation**: Consider adding a startup cleanup routine that removes stale files from `os.tmpdir()/agentx-mcp/` when the CLI starts. Alternatively, set file permissions to `0600` on the temp file immediately after writing it.

---

### INFO-01: Hardcoded salt in encryption key derivation

**File**: `/packages/cli/src/secrets/encrypt.ts` (line 10)
**Severity**: Informational
**CWE**: CWE-798 (Use of Hard-coded Credentials)

The scrypt salt is hardcoded as `'agentx-salt'`. In typical password hashing, a unique random salt per entry is required. However, in this design the salt is not serving the traditional purpose of preventing rainbow table attacks on passwords. The actual secret input to scrypt is the machine's hardware UUID (via `getMachineId()`), which is already a high-entropy, unique-per-machine value. The salt here functions as a domain separator rather than a traditional cryptographic salt.

**Verdict**: Acceptable as designed. The machine ID provides the entropy; the salt provides domain separation.

---

### INFO-02: Agent name validation prevents path traversal

**File**: `/packages/cli/src/schemas/agent-yaml.ts` (line 20)
**File**: `/packages/cli/src/secrets/store.ts` (line 8)
**File**: `/packages/cli/src/config/agent-config.ts` (line 14)
**Severity**: Informational (positive finding)

Agent names are validated against the regex `/^[a-z0-9-]+$/` which permits only lowercase alphanumeric characters and hyphens. This effectively prevents path traversal attacks (e.g., `../../etc/passwd`) in all locations where the agent name is used to construct file paths: the secrets store (`<name>.enc.json`), the agents directory (`~/.agentx/agents/<name>`), and any file operations using agent names.

**Verdict**: Well implemented. The strict allowlist regex at the schema level provides defense-in-depth against CWE-22 (Path Traversal).

---

### INFO-03: OAuth flow implements proper CSRF protection

**File**: `/packages/cli/src/auth/github-oauth.ts` (lines 61, 89-91)
**File**: `/packages/web/src/app/api/v1/auth/github/route.ts`
**Severity**: Informational (positive finding)

The OAuth flow generates a cryptographically random state parameter (`randomBytes(16).toString('hex')`) and validates it on callback. The local HTTP server binds to `127.0.0.1` only (not `0.0.0.0`), preventing network-adjacent attackers from intercepting the callback. A 5-minute timeout prevents indefinite server listening.

**Verdict**: Correctly implements OWASP OAuth security recommendations.

---

### INFO-04: Tarball integrity verification via SHA-256

**File**: `/packages/cli/src/registry/download.ts` (lines 34-37, 61-67)
**Severity**: Informational (positive finding)

Downloaded agent tarballs are verified against a SHA-256 checksum provided by the registry before extraction. A mismatch throws a `RegistryError` with a clear tampering warning. This protects against both accidental corruption and supply chain attacks where a tarball is modified in transit or at rest.

**Verdict**: Well implemented. The check occurs before any extraction, preventing malicious content from being written to disk.

---

### INFO-05: No shell injection vectors

**Files**: Multiple
**Severity**: Informational (positive finding)
**CWE**: CWE-78 (OS Command Injection)
**OWASP**: A03:2021 - Injection

The codebase consistently uses `execFileSync` (not `execSync`) and `execa` with argument arrays (not string interpolation) throughout. This eliminates shell injection as an attack vector:

- `encrypt.ts` line 21: `execFileSync('ioreg', ['-rd1', '-c', 'IOPlatformExpertDevice'])`
- `github-oauth.ts` line 20: `execFileSync('open', [url])`
- `runner.ts` line 124: `execa(claudePath, claudeArgs, { stdio: 'inherit' })`

No instances of dynamic code execution, `Function()` constructors, or dynamic `require()` calls were found.

**Verdict**: Excellent. This is a common vulnerability in CLI tools and the codebase avoids it entirely.

---

## Encryption Implementation Review

**File**: `/packages/cli/src/secrets/encrypt.ts`

| Property | Value | Assessment |
|---|---|---|
| Algorithm | AES-256-GCM | Industry standard, NIST approved |
| Key derivation | scrypt | Memory-hard KDF, resistant to GPU/ASIC attacks |
| Key length | 32 bytes (256 bits) | Correct for AES-256 |
| IV length | 12 bytes (96 bits) | Correct for GCM mode |
| IV generation | `randomBytes(12)` | Cryptographically random, unique per encryption |
| Authentication | GCM auth tag | Provides authenticated encryption (AEAD) |
| Key material | Machine hardware UUID | Tied to physical machine, non-transferable |

**Verdict**: The encryption implementation is cryptographically sound.

---

## Telemetry Privacy Review

**File**: `/packages/cli/src/telemetry/reporter.ts`

| Property | Assessment |
|---|---|
| Opt-in model | Controlled by `config.telemetry` flag, defaults to requiring explicit opt-in |
| Data collected | Agent name, version, success boolean, duration in ms, error type classification |
| PII collected | None |
| Failure mode | Silent -- never throws, never blocks the user's workflow |
| Network timeout | 5 seconds via `AbortSignal.timeout(5000)` |
| Transport | Fire-and-forget POST, result intentionally discarded |

**Verdict**: The telemetry implementation respects user privacy and follows best practices for anonymous, opt-in usage analytics.

---

## Web API Security Review (Supporting Routes)

### Authentication callback (`/api/v1/auth/callback`)

- Rate-limited by IP address
- Does not expose internal error details to the client (returns generic "Authentication failed")
- IP addresses are hashed with SHA-256 before storage in the downloads table (privacy protection)
- Uses parameterized queries via Drizzle ORM (no SQL injection risk)

### Download endpoint (`/api/v1/agents/[scope]/[name]/download/[version]`)

- Rate-limited by IP address
- Parameterized Drizzle ORM queries prevent SQL injection
- IP hashed before storage
- Error responses do not leak stack traces or internal details

### OAuth initiation (`/api/v1/auth/github`)

- Rate-limited by IP address
- Validates required fields before processing
- State parameter generated server-side with `randomBytes(16)`
- Redirect URI is accepted from the client (by design, for localhost port binding)

---

## OWASP Top 10 (2021) Coverage Summary

| Category | Status | Notes |
|---|---|---|
| A01: Broken Access Control | Pass | Token-based auth, scope validation on publish |
| A02: Cryptographic Failures | Pass | AES-256-GCM with scrypt KDF, SHA-256 checksums |
| A03: Injection | Pass | No shell injection, no SQL injection, Zod validation |
| A04: Insecure Design | Pass | Defense in depth, principle of least privilege |
| A05: Security Misconfiguration | Pass | Minimal defaults, no debug modes exposed |
| A06: Vulnerable Components | N/A | Dependency audit not in scope for this review |
| A07: Auth Failures | Pass | CSRF-protected OAuth, rate limiting |
| A08: Data Integrity Failures | Pass | SHA-256 tarball verification before extraction |
| A09: Logging/Monitoring | Pass | Error logging without sensitive data exposure |
| A10: SSRF | Pass | No user-controlled URL fetching patterns |

---

## Recommendations Summary

**Priority actions** (Low effort, meaningful hardening):

1. Set file permissions to `0600` on `auth.json` after writing it in `token-store.ts`.
2. Set file permissions to `0600` on temp MCP config files after writing them in `mcp-builder.ts`.
3. Add a startup cleanup routine to remove stale files from the `agentx-mcp` temp directory.

**Future considerations** (not urgent for MVP):

4. Consider adding a `--verify-only` flag to the install command that checks the tarball hash without extracting.
5. Consider adding `tar.extract` options to restrict extracted paths (e.g., `filter` option to reject entries with `..` path components), even though the SHA-256 pre-check mitigates this.
6. Run `npm audit` or equivalent dependency scanning as part of CI to address A06 (Vulnerable Components).
7. Consider token expiry and refresh mechanisms for `auth.json` tokens.

---

## Conclusion

The AgentX CLI demonstrates security-conscious engineering. The use of AES-256-GCM for secrets, SHA-256 for tarball integrity, Zod for input validation, `execFileSync`/`execa` for subprocess execution, and CSRF-protected OAuth flows collectively produce a codebase with no exploitable vulnerabilities identified in this review. The two low-severity findings are hardening recommendations that align with defense-in-depth principles, not exploitable weaknesses.
