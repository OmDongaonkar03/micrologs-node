# Changelog

All notable changes to `@micrologs/node` will be documented here.

---

## [1.0.1] - 2026-03-02

### Added
- ESM support via `index.mjs` wrapper — `import Micrologs from "@micrologs/node"` now works correctly alongside the existing CommonJS `require()`
- `exports` field in `package.json` — Node resolves the correct entry point automatically based on the caller's module system

### Fixed
- ESM import example in README was previously incorrect — the package was CJS only. Both `require` and `import` now work as documented.

---

## [1.0.0] - 2026-03-02

Complete API coverage. Bumped to v1.0.0 - the SDK now wraps every endpoint the Micrologs engine exposes.

### Added
- `client.getLink(code)` - fetch a single tracked link by code with click count
- `client.editLink(code, options)` - edit a link's `destinationUrl`, `label`, or `isActive`
- `client.updateErrorStatus(ids, status)` - update error group status individually or in bulk. Accepts a single ID or an array (max 100). Valid statuses: `open`, `investigating`, `resolved`, `ignored`

### Requires
- Micrologs engine v1.3.0+ for `getLink`, `editLink`, and `updateErrorStatus`

---

## [0.1.0] - 2026-03-01

Initial release.

### Added
- `client.error()` - track errors from any Node.js backend
- `client.audit()` - track audit events
- `client.createLink()` - create tracked short links
- `client.deleteLink()` - delete tracked links
- `client.verify()` - verify a public or secret key
- `client.analytics.*` - full analytics query surface: visitors, returning, sessions, pages, devices, locations, referrers, utm, errors, errorsTrend, errorDetail, audits, links, linkDetail
- Silent failure by design - all methods return `null` on error, never throw
- Private class fields - key and host never exposed on the instance