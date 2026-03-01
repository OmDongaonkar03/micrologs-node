# @micrologs/node

Node.js SDK for [Micrologs](https://github.com/OmDongaonkar03/Micrologs) - self-hosted analytics and error tracking.

**Requires Node.js 18+**

---

## How it works

Micrologs is an engine you install on your own server. You own the database, you own the data. This SDK is a thin wrapper around its REST API - it makes HTTP calls to your server, not to any third-party service.

```
Your Node app  →  SDK  →  your Micrologs server  →  your database
```

Nothing goes anywhere you don't control.

---

## Install

```bash
npm install @micrologs/node
```

---

## Initialize

```javascript
// CommonJS
const Micrologs = require("@micrologs/node")

// ESM
import Micrologs from "@micrologs/node"

const client = new Micrologs({
    host: "https://analytics.yourdomain.com", // your server - where Micrologs is installed
    key:  "your_secret_key"                   // your project secret key
})
```

Both `host` and `key` are required. The constructor will throw immediately if either is missing.

`host` is the URL of the server where you installed Micrologs. `key` is the secret key for your project - find it in your `env.php`. Never use the public key here - that's for the JS snippet only.

---

## Tracking

### Track an error

Use this to send errors from your Node backend to Micrologs. Works alongside the JS snippet - the snippet catches frontend errors, this catches backend errors.

```javascript
try {
    await processPayment(order)
} catch (err) {
    await client.error(err.message, {
        type:        "CheckoutError",      // groups errors of the same type together
        severity:    "critical",           // info | warning | error | critical
        file:        "checkout.js",
        line:        42,
        stack:       err.stack,
        url:         "/api/checkout",
        environment: "production",         // default: "production"
        context:     { order_id: 123, amount: 2999 } // any extra data, capped at 8KB
    })
}
```

All fields except `message` are optional.

**How grouping works:** Micrologs hashes `error_type + message + file + line` into a fingerprint. The same error firing 1000 times creates 1 group with 1000 occurrences - not 1000 separate records. If you mark a group as resolved and it fires again, it automatically reopens.

**Response:**
```json
{
    "success": true,
    "message": "OK",
    "data": {
        "group_id": 12
    }
}
```

`group_id` is the error group this occurrence was added to. Useful for logging on your side.

---

### Track an audit event

Use this to record any action that matters in your application - logins, payments, config changes, anything you want a trail for.

```javascript
// action (required), actor (optional), context (optional)
await client.audit("user.login",        "user@email.com", { ip: "1.2.3.4", role: "admin" })
await client.audit("order.placed",      "user@email.com", { order_id: 123, amount: 2999 })
await client.audit("settings.updated",  "admin@email.com")
await client.audit("api_key.rotated",   "admin@email.com")
```

`action` is a free-form string - use dot notation by convention (`resource.action`) for easy filtering. `actor` is whoever triggered the action. `context` is any extra data you want attached.

---

## Link management

### Create a tracked short link

```javascript
const link = await client.createLink(
    "https://yourdomain.com/pricing", // destination URL
    "Pricing CTA"                     // optional label
)

console.log(link.data)
// {
//     code:            "aB3xYz12",
//     short_url:       "https://analytics.yourdomain.com/api/redirect.php?c=aB3xYz12",
//     destination_url: "https://yourdomain.com/pricing",
//     label:           "Pricing CTA"
// }
```

Every click on the short link is tracked with timestamp, referrer, and location. Query click analytics via `client.analytics.linkDetail({ code: "aB3xYz12" })`.

### Delete a link

```javascript
await client.deleteLink("aB3xYz12")
```

### Get a single link

```javascript
const link = await client.getLink("aB3xYz12")
// Returns link details including total_clicks
```

### Edit a link

```javascript
// Any combination of fields - all optional except code
await client.editLink("aB3xYz12", {
    destinationUrl: "https://yourdomain.com/new-page",
    label:          "Updated CTA",
    isActive:       false
})
```

---

## Analytics

All analytics methods return data from your Micrologs server as plain JSON. Every response follows this shape:

```json
{
    "success": true,
    "message": "...",
    "data": { ... }
}
```

Access your data via `result.data`.

### Common params

All analytics methods accept an optional params object:

| Param | Type | Default | Description |
|---|---|---|---|
| `range` | string | `"30d"` | `"7d"` / `"30d"` / `"90d"` / `"custom"` |
| `from` | string | - | `"YYYY-MM-DD"` - required when `range="custom"` |
| `to` | string | - | `"YYYY-MM-DD"` - required when `range="custom"` |

Custom ranges are capped at 365 days and `from` must be before `to`.

---

### Visitors

```javascript
const result = await client.analytics.visitors({ range: "30d" })

console.log(result.data)
// {
//     range:           { from: "2026-01-31", to: "2026-03-01" },
//     unique_visitors: 1842,
//     total_pageviews: 5631,
//     total_sessions:  2109,
//     bounce_rate:     43.2,
//     over_time: [
//         { date: "2026-01-31", pageviews: 178, unique_visitors: 91 },
//         { date: "2026-02-01", pageviews: 204, unique_visitors: 113 },
//         ...
//     ]
// }
```

---

### New vs returning visitors

```javascript
const result = await client.analytics.returning({ range: "30d" })

console.log(result.data)
// {
//     total_visitors:     500,
//     new_visitors:       340,
//     returning_visitors: 160,
//     new_pct:            68.0,
//     returning_pct:      32.0,
//     over_time: [
//         { date: "2026-02-01", new_visitors: 12, returning_visitors: 5 },
//         ...
//     ]
// }
```

New = first visit falls within the selected range. Returning = visited before the range and came back within it.

---

### Sessions

```javascript
const result = await client.analytics.sessions({ range: "7d" })

console.log(result.data)
// {
//     total_sessions:        2109,
//     bounce_rate:           43.2,
//     avg_duration_seconds:  91,   // all sessions including bounces
//     avg_duration_engaged:  180,  // bounced sessions excluded - more honest number
//     avg_pages_per_session: 2.67,
//     over_time: [
//         { date: "2026-02-01", sessions: 45, avg_duration_seconds: 120 },
//         ...
//     ]
// }
```

`avg_duration_engaged` excludes bounced sessions (visitors who left immediately). It's a more accurate measure of how long engaged users actually stay.

---

### Pages

```javascript
const result = await client.analytics.pages({ range: "30d", limit: 10 })

console.log(result.data)
// [
//     { url: "/", page_title: "Home", pageviews: 1200, unique_visitors: 800 },
//     { url: "/pricing", page_title: "Pricing", pageviews: 430, unique_visitors: 310 },
//     ...
// ]
```

---

### Locations

```javascript
const result = await client.analytics.locations({ range: "30d" })
// Breakdown by country, region, and city
```

---

### Devices

```javascript
const result = await client.analytics.devices({ range: "30d" })
// Breakdown by device type (desktop/mobile/tablet), OS, browser
```

---

### Referrers

```javascript
const result = await client.analytics.referrers({ range: "30d" })
// Traffic sources categorized: organic, social, email, referral, direct
```

---

### UTM campaigns

```javascript
const result = await client.analytics.utm({ range: "30d" })
// Breakdown by utm_source, utm_medium, utm_campaign
```

---

### Errors

```javascript
// All error groups
const result = await client.analytics.errors({ range: "30d" })

// Daily error trend across all groups
const trend = await client.analytics.errorsTrend({ range: "30d" })

// Daily trend for one specific error group
const groupTrend = await client.analytics.errorsTrend({ range: "30d", group_id: 12 })

// Full detail for one error group - all occurrences, stack traces, context
const detail = await client.analytics.errorDetail({ id: 12 })
```

### Update error status

Mark error groups as `investigating`, `resolved`, `ignored`, or reopen as `open`. Accepts a single ID or an array of up to 100.

```javascript
// Start investigating
await client.updateErrorStatus(42, "investigating")

// Resolve a single group
await client.updateErrorStatus(42, "resolved")

// Bulk ignore
await client.updateErrorStatus([12, 15, 22], "ignored")
```

---

### Audit log

```javascript
const result = await client.analytics.audits({ range: "7d" })
```

---

### Tracked links

```javascript
// All links with click counts
const result = await client.analytics.links({ range: "30d" })

// Detail for one link - clicks over time
const detail = await client.analytics.linkDetail({ code: "aB3xYz12", range: "30d" })
```

---

### Custom date range

```javascript
const result = await client.analytics.visitors({
    range: "custom",
    from:  "2026-01-01",
    to:    "2026-01-31"
})
```

---

## Verify a key

```javascript
const result = await client.verify("some_key")
// Returns whether the key is valid and which project it belongs to
```

---

## Error handling

The SDK never throws or crashes your application. If a network error occurs, the server is unreachable, or the server returns an error - the method returns `null` and logs a warning via `console.warn`. This is intentional.

```javascript
const result = await client.error("Payment failed")

if (result === null) {
    // SDK call failed - your server may be unreachable
    // Your application continues normally regardless
}
```

Analytics failures should never affect your application's users.

---

## Full method reference

| Method | Description |
|---|---|
| `client.error(message, options?)` | Track a backend error |
| `client.audit(action, actor?, context?)` | Track an audit event |
| `client.createLink(destinationUrl, label?)` | Create a tracked short link |
| `client.getLink(code)` | Fetch a single tracked link by code |
| `client.editLink(code, options?)` | Edit a link's destination, label, or active state |
| `client.deleteLink(code)` | Delete a tracked link by code |
| `client.updateErrorStatus(ids, status)` | Update error group status - single ID or array |
| `client.verify(key)` | Verify a public or secret key |
| `client.analytics.visitors(params?)` | Unique visitors, pageviews, sessions, bounce rate |
| `client.analytics.returning(params?)` | New vs returning visitors |
| `client.analytics.sessions(params?)` | Session duration, pages per session |
| `client.analytics.pages(params?)` | Top pages by pageviews |
| `client.analytics.devices(params?)` | Device, OS, browser breakdown |
| `client.analytics.locations(params?)` | Country, region, city breakdown |
| `client.analytics.referrers(params?)` | Traffic sources |
| `client.analytics.utm(params?)` | UTM campaign data |
| `client.analytics.errors(params?)` | Error groups with occurrence counts |
| `client.analytics.errorsTrend(params?)` | Daily error trend, top groups |
| `client.analytics.errorDetail(params?)` | Single error group - all occurrences and detail |
| `client.analytics.audits(params?)` | Audit log events |
| `client.analytics.links(params?)` | Tracked links with click counts |
| `client.analytics.linkDetail(params?)` | Single link - clicks over time |

---

## Requirements

- Node.js 18+ - uses native `fetch` and private class fields (`#field`). No polyfills, no build step.
- A running [Micrologs](https://github.com/OmDongaonkar03/Micrologs) server (v1.3.0+)

---

## License

MIT - [Om Dongaonkar](https://github.com/OmDongaonkar03)