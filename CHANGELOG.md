# Changelog

All notable changes to `@micrologs/node` will be documented here.

---

## [0.1.0] - 2026-03-01

Initial release.

### Added
- `client.error()` — track errors from any Node.js backend
- `client.audit()` — track audit events
- `client.createLink()` — create tracked short links
- `client.deleteLink()` — delete tracked links
- `client.verify()` — verify a public or secret key
- `client.analytics.*` — full analytics query surface: visitors, returning, sessions, pages, devices, locations, referrers, utm, errors, errorsTrend, errorDetail, audits, links, linkDetail
- Silent failure by design — all methods return `null` on error, never throw
- Private class fields — key and host never exposed on the instance