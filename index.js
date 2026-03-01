"use strict";

/**
 * Micrologs Node.js SDK
 * https://github.com/OmDongaonkar03/micrologs-node
 *
 * Requires Node.js 18+ (native fetch + private class fields)
 */

class Micrologs {
  #host;
  #key;

  /**
   * @param {object} options
   * @param {string} options.host  - Your Micrologs server URL (e.g. https://analytics.yourdomain.com)
   * @param {string} options.key   - Your project secret key
   */
  constructor({ host, key }) {
    if (!host || typeof host !== "string") {
      throw new Error("[Micrologs] options.host is required (your server URL)");
    }
    if (!key || typeof key !== "string") {
      throw new Error("[Micrologs] options.key is required (your secret key)");
    }

    this.#host = host.replace(/\/$/, ""); // strip trailing slash
    this.#key = key;
  }

  // ── Internal helpers ──────────────────────────────────────────

  async #post(endpoint, payload) {
    try {
      const res = await fetch(`${this.#host}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": this.#key,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(`${res.status}: ${data.message ?? "Request failed"}`);
      }

      return data;
    } catch (err) {
      // Never crash the caller's application over analytics
      console.warn("[Micrologs]", err.message);
      return null;
    }
  }

  async #get(endpoint, params = {}) {
    try {
      // Remove undefined/null params
      const clean = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v != null),
      );
      const query = new URLSearchParams(clean).toString();
      const url = `${this.#host}${endpoint}${query ? "?" + query : ""}`;

      const res = await fetch(url, {
        method: "GET",
        headers: { "X-API-Key": this.#key },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(`${res.status}: ${data.message ?? "Request failed"}`);
      }

      return data;
    } catch (err) {
      console.warn("[Micrologs]", err.message);
      return null;
    }
  }

  // ── Tracking ──────────────────────────────────────────────────

  /**
   * Track an error from any backend.
   *
   * @param {string} message
   * @param {object} options
   * @param {string} [options.type="ManualError"]
   * @param {string} [options.severity="error"]  info | warning | error | critical
   * @param {string} [options.file]
   * @param {number} [options.line]
   * @param {string} [options.stack]
   * @param {string} [options.url]
   * @param {string} [options.environment="production"]
   * @param {object} [options.context]
   */
  async error(message, options = {}) {
    return this.#post("/api/track/error.php", {
      message: String(message).slice(0, 1024),
      error_type: options.type ?? "ManualError",
      severity: options.severity ?? "error",
      file: options.file ?? "",
      line: options.line ?? null,
      stack: options.stack ?? null,
      url: options.url ?? "",
      environment: options.environment ?? "production",
      context: options.context ?? null,
    });
  }

  /**
   * Track an audit event.
   *
   * @param {string} action  - e.g. "user.login", "order.placed"
   * @param {string} [actor] - e.g. "user@email.com"
   * @param {object} [context]
   */
  async audit(action, actor = "", context = null) {
    if (!action || typeof action !== "string") {
      console.warn("[Micrologs] audit() requires an action string");
      return null;
    }
    return this.#post("/api/track/audit.php", { action, actor, context });
  }

  // ── Link management ───────────────────────────────────────────

  /**
   * Create a tracked short link.
   *
   * @param {string} destinationUrl
   * @param {string} [label]
   */
  async createLink(destinationUrl, label = "") {
    if (!destinationUrl) {
      console.warn("[Micrologs] createLink() requires a destinationUrl");
      return null;
    }
    return this.#post("/api/links/create.php", {
      destination_url: destinationUrl,
      label,
    });
  }

  /**
   * Delete a tracked link by code.
   *
   * @param {string} code - The short link code (e.g. "aB3xYz12")
   */
  async deleteLink(code) {
    if (!code) {
      console.warn("[Micrologs] deleteLink() requires a code");
      return null;
    }
    return this.#post("/api/links/delete.php", { code });
  }

  /**
   * Verify a public or secret key.
   *
   * @param {string} key
   */
  async verify(key) {
    return this.#post("/api/projects/verify.php", { key });
  }

  // ── Analytics ─────────────────────────────────────────────────

  /**
   * All analytics endpoints.
   * Every method accepts an optional params object.
   *
   * Common params:
   *   range  {string}  "7d" | "30d" | "90d" | "custom"  (default: "30d")
   *   from   {string}  "YYYY-MM-DD"  (required when range="custom")
   *   to     {string}  "YYYY-MM-DD"  (required when range="custom")
   *
   * @example
   * await client.analytics.visitors({ range: "7d" })
   * await client.analytics.visitors({ range: "custom", from: "2026-01-01", to: "2026-01-31" })
   */
  get analytics() {
    return {
      /** Unique visitors, pageviews, sessions, bounce rate, over time */
      visitors: (params) => this.#get("/api/analytics/visitors.php", params),

      /** New vs returning visitors, percentage split, over time */
      returning: (params) =>
        this.#get("/api/analytics/visitors-returning.php", params),

      /** Avg session duration, avg pages per session, over time */
      sessions: (params) => this.#get("/api/analytics/sessions.php", params),

      /** Top pages by pageviews */
      pages: (params) => this.#get("/api/analytics/pages.php", params),

      /** Breakdown by device type, OS, browser */
      devices: (params) => this.#get("/api/analytics/devices.php", params),

      /** Breakdown by country, region, city */
      locations: (params) => this.#get("/api/analytics/locations.php", params),

      /** Traffic sources */
      referrers: (params) => this.#get("/api/analytics/referrers.php", params),

      /** UTM campaign data */
      utm: (params) => this.#get("/api/analytics/utm.php", params),

      /** Error groups with occurrence counts */
      errors: (params) => this.#get("/api/analytics/errors.php", params),

      /** Daily error trend, top groups. Pass { group_id } to scope to one group */
      errorsTrend: (params) =>
        this.#get("/api/analytics/errors-trend.php", params),

      /** Single error group with all events. Requires { id } param */
      errorDetail: (params) =>
        this.#get("/api/analytics/error-detail.php", params),

      /** Audit log events */
      audits: (params) => this.#get("/api/analytics/audits.php", params),

      /** All tracked links with click counts */
      links: (params) => this.#get("/api/analytics/links.php", params),

      /** Single link detail with clicks over time. Requires { code } param */
      linkDetail: (params) =>
        this.#get("/api/analytics/link-detail.php", params),
    };
  }
}

module.exports = Micrologs;
