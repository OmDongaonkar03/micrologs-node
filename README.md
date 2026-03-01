# @micrologs/node

Node.js SDK for [Micrologs](https://github.com/OmDongaonkar03/Micrologs) - self-hosted analytics and error tracking.

Micrologs is an engine you run on your own server. This SDK wraps its REST API so you can track errors, audit events, and query your analytics from any Node.js application without writing raw HTTP calls.

**Requires Node.js 18+**

---

## Install

```bash
npm install @micrologs/node
```

---

## Initialize

```javascript
const Micrologs = require("@micrologs/node")

const client = new Micrologs({
    host: "https://analytics.yourdomain.com", // your Micrologs server
    key:  "your_secret_key"
})
```

`host` is your own server where Micrologs is installed. Your data never leaves it.

---

## Tracking

### Track an error

```javascript
await client.error("Payment failed", {
    type:     "CheckoutError",
    severity: "critical",          // info | warning | error | critical
    file:     "checkout.js",
    line:     42,
    stack:    err.stack,
    url:      "/checkout",
    context:  { order_id: 123, amount: 2999 }
})
```

All options are optional except the message. Errors are grouped by fingerprint - the same error firing 1000 times creates 1 group with 1000 occurrences.

### Track an audit event

```javascript
await client.audit("user.login", "user@email.com", { role: "admin" })
await client.audit("order.placed", "user@email.com", { order_id: 123 })
await client.audit("settings.updated", "admin@email.com")
```

Arguments: `action` (required), `actor` (optional), `context` (optional).

---

## Link management

### Create a tracked link

```javascript
const link = await client.createLink("https://yourdomain.com/pricing", "Pricing CTA")
console.log(link.data.short_url) // https://analytics.yourdomain.com/go/aB3xYz12
```

### Delete a link

```javascript
await client.deleteLink("aB3xYz12")
```

---

## Analytics

All analytics methods accept an optional params object.

**Common params:**

| Param | Type | Default | Description |
|---|---|---|---|
| `range` | string | `"30d"` | `"7d"` / `"30d"` / `"90d"` / `"custom"` |
| `from` | string | - | `"YYYY-MM-DD"` - required when `range="custom"` |
| `to` | string | - | `"YYYY-MM-DD"` - required when `range="custom"` |

```javascript
// Visitors overview
const visitors = await client.analytics.visitors({ range: "30d" })
console.log(visitors.data.unique_visitors)
console.log(visitors.data.bounce_rate)

// New vs returning
const retention = await client.analytics.returning({ range: "30d" })
console.log(retention.data.new_pct)
console.log(retention.data.returning_pct)

// Session analytics
const sessions = await client.analytics.sessions({ range: "7d" })
console.log(sessions.data.avg_duration_engaged) // seconds, bounce sessions excluded

// Top pages
const pages = await client.analytics.pages({ range: "30d", limit: 10 })

// Locations
const locations = await client.analytics.locations({ range: "30d" })

// Devices
const devices = await client.analytics.devices({ range: "30d" })

// Referrers
const referrers = await client.analytics.referrers({ range: "30d" })

// UTM campaigns
const utm = await client.analytics.utm({ range: "30d" })

// Error groups
const errors = await client.analytics.errors({ range: "30d" })

// Error trend over time
const trend = await client.analytics.errorsTrend({ range: "30d" })

// Single error group trend
const groupTrend = await client.analytics.errorsTrend({ range: "30d", group_id: 5 })

// Error group detail
const detail = await client.analytics.errorDetail({ id: 5 })

// Audit log
const audits = await client.analytics.audits({ range: "7d" })

// Tracked links
const links = await client.analytics.links({ range: "30d" })

// Single link detail
const linkDetail = await client.analytics.linkDetail({ code: "aB3xYz12" })

// Custom date range
const custom = await client.analytics.visitors({
    range: "custom",
    from:  "2026-01-01",
    to:    "2026-01-31"
})
```

---

## Error handling

The SDK never throws or crashes your application. If a request fails, the method returns `null` and logs a warning to `console.warn`. This is intentional - analytics should never take down your app.

```javascript
const result = await client.error("Something broke")
if (!result) {
    // request failed silently - check your server logs
}
```

---

## Full method reference

| Method | Description |
|---|---|
| `client.error(message, options)` | Track an error |
| `client.audit(action, actor, context)` | Track an audit event |
| `client.createLink(destinationUrl, label)` | Create a tracked short link |
| `client.deleteLink(code)` | Delete a tracked link |
| `client.verify(key)` | Verify a public or secret key |
| `client.analytics.visitors(params)` | Visitors, pageviews, sessions, bounce rate |
| `client.analytics.returning(params)` | New vs returning visitors |
| `client.analytics.sessions(params)` | Session duration, pages per session |
| `client.analytics.pages(params)` | Top pages |
| `client.analytics.devices(params)` | Device, OS, browser breakdown |
| `client.analytics.locations(params)` | Country, region, city breakdown |
| `client.analytics.referrers(params)` | Traffic sources |
| `client.analytics.utm(params)` | UTM campaign data |
| `client.analytics.errors(params)` | Error groups |
| `client.analytics.errorsTrend(params)` | Daily error trend, top groups |
| `client.analytics.errorDetail(params)` | Single error group detail |
| `client.analytics.audits(params)` | Audit log |
| `client.analytics.links(params)` | Tracked links |
| `client.analytics.linkDetail(params)` | Single link detail |

---

## Requirements

- Node.js 18+ (uses native `fetch` and private class fields)
- A running [Micrologs](https://github.com/OmDongaonkar03/Micrologs) server

---

## License

MIT - [Om Dongaonkar](https://github.com/OmDongaonkar03)