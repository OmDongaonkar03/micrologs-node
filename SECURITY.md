# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| 1.x | ✅ Active |

---

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Report privately via GitHub Security Advisories:

**[→ Report a vulnerability](https://github.com/OmDongaonkar03/micrologs-node/security/advisories/new)**

You will receive a response within 72 hours.

---

## Security Design

**Keys are private class fields.** `#host` and `#key` are stored as private class fields - they cannot be accessed or leaked via `console.log(client)` or `JSON.stringify(client)`.

**The SDK never stores or logs your key.** It is only used in request headers and is never written to disk, logged, or exposed in error messages.

**The SDK never throws.** All failures are silent - returned as `null` with a `console.warn`. This prevents analytics failures from leaking stack traces or sensitive context into your application's error handling.