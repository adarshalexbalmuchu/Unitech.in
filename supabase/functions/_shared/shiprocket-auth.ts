/**
 * ShipRocket authentication and API fetch utility.
 *
 * USAGE
 * ─────
 * Import shipRocketFetch in every Edge Function that calls the ShipRocket API.
 * Pass the Supabase service-role client as the last argument — this utility
 * never creates its own Supabase client.
 *
 *   import { shipRocketFetch } from "../_shared/shiprocket-auth.ts";
 *
 *   const data = await shipRocketFetch(
 *     "/orders/create/adhoc",
 *     { method: "POST", body: payload, action: "create_order", orderId: id },
 *     serviceClient,
 *   );
 *
 * ENVIRONMENT VARIABLES (all required, never hardcoded here)
 * ──────────────────────────────────────────────────────────
 *   SHIPROCKET_API_BASE  — staging or production base URL (swap for environment)
 *   SHIPROCKET_EMAIL     — ShipRocket account email
 *   SHIPROCKET_PASSWORD  — ShipRocket account password
 *
 * TOKEN LIFECYCLE
 * ───────────────
 * ShipRocket JWTs expire after 24 hours. This module caches the token at
 * module level and proactively refreshes it when fewer than 5 minutes remain.
 * If an API call returns 401, the cache is invalidated, one re-auth is
 * attempted, and the call is retried once. A second 401 throws AuthError —
 * no further retries occur.
 *
 * AUDIT LOGGING
 * ─────────────
 * Every API call (success and failure) is written to shiprocket_audit_log.
 * Audit log failures are caught and logged to console — they never break
 * the primary operation.
 */

declare const Deno: {
  env: { get: (key: string) => string | undefined };
};

// ─── Minimal structural type for the Supabase client parameter ───────────────
// Defined here to avoid a URL import in a shared utility. The actual
// SupabaseClient returned by createClient() satisfies this structurally.

interface AuditClient {
  from(table: string): {
    insert(data: Record<string, unknown>): Promise<{ error: unknown }>;
  };
}

// ─── Typed errors ─────────────────────────────────────────────────────────────

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export class ShipRocketAPIError extends Error {
  readonly statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "ShipRocketAPIError";
    this.statusCode = statusCode;
  }
}

// ─── Module-level token cache ─────────────────────────────────────────────────
// Shared across all invocations of this module within the same Edge Function
// isolate lifetime. Each cold start begins with a null cache.

interface TokenCache {
  token: string;
  expiresAt: number; // Unix ms
}

let tokenCache: TokenCache | null = null;

// ─── Internal: fetch a fresh token from ShipRocket ───────────────────────────

async function fetchFreshToken(): Promise<string> {
  const apiBase = Deno.env.get("SHIPROCKET_API_BASE");
  const email = Deno.env.get("SHIPROCKET_EMAIL");
  const password = Deno.env.get("SHIPROCKET_PASSWORD");

  if (!apiBase || !email || !password) {
    throw new AuthError(
      "Missing required env vars: SHIPROCKET_API_BASE, SHIPROCKET_EMAIL, SHIPROCKET_PASSWORD",
    );
  }

  const res = await fetch(`${apiBase}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new AuthError(
      `ShipRocket login failed [${res.status}]: ${await res.text()}`,
    );
  }

  const data = await res.json();

  if (!data?.token || typeof data.token !== "string") {
    throw new AuthError("ShipRocket auth response did not contain a token");
  }

  // ShipRocket tokens expire after 24 hours.
  // Cache for 23 h 55 min — proactive 5-minute safety margin before expiry.
  const TTL_MS = (23 * 60 + 55) * 60 * 1000;
  tokenCache = {
    token: data.token,
    expiresAt: Date.now() + TTL_MS,
  };

  return data.token;
}

// ─── Exported: get a valid token (refreshes proactively) ─────────────────────

export async function getShipRocketToken(): Promise<string> {
  const FIVE_MINUTES_MS = 5 * 60 * 1000;

  if (tokenCache && tokenCache.expiresAt - Date.now() > FIVE_MINUTES_MS) {
    return tokenCache.token;
  }

  // Cache is missing or within the 5-minute expiry window — refresh now.
  tokenCache = null;
  return fetchFreshToken();
}

// ─── Internal: write one audit log entry (fire-and-forget) ───────────────────

async function writeAuditLog(
  supabase: AuditClient,
  entry: {
    order_id?:        string;
    shipment_id?:     string;
    action:           string;
    request_payload?: unknown;
    response_payload?: unknown;
    status_code?:     number;
    success:          boolean;
    error_message?:   string;
    called_by?:       string;
  },
): Promise<void> {
  try {
    await supabase.from("shiprocket_audit_log").insert({
      order_id:         entry.order_id        ?? null,
      shipment_id:      entry.shipment_id     ?? null,
      action:           entry.action,
      request_payload:  entry.request_payload  ?? null,
      response_payload: entry.response_payload ?? null,
      status_code:      entry.status_code      ?? null,
      success:          entry.success,
      error_message:    entry.error_message    ?? null,
      called_by:        entry.called_by        ?? "system",
      called_at:        new Date().toISOString(),
    });
  } catch (err) {
    // Audit failures must never break the primary API call.
    console.error("[shiprocket-auth] audit log write failed:", err);
  }
}

// ─── Exported: authenticated fetch wrapper ────────────────────────────────────

export interface ShipRocketFetchOptions {
  method?:     string;
  body?:       unknown;
  /** Written to shiprocket_audit_log.action — use a value from the defined set */
  action:      string;
  orderId?:    string;
  shipmentId?: string;
  calledBy?:   string;
}

/**
 * Makes an authenticated request to the ShipRocket API.
 *
 * - Automatically attaches the Bearer token.
 * - On 401: invalidates cache, re-authenticates once, retries once.
 *   A second 401 throws AuthError immediately — no further retries.
 * - Logs every call (success and failure) to shiprocket_audit_log.
 * - Throws ShipRocketAPIError for non-2xx responses other than 401.
 *
 * @param path      API path relative to SHIPROCKET_API_BASE, e.g. "/orders/create/adhoc"
 * @param options   Request options + audit context
 * @param supabase  Service-role Supabase client (caller creates and passes this)
 * @returns         Parsed JSON response body
 */
export async function shipRocketFetch(
  path: string,
  options: ShipRocketFetchOptions,
  supabase: AuditClient,
): Promise<unknown> {
  const apiBase = Deno.env.get("SHIPROCKET_API_BASE");
  if (!apiBase) {
    throw new AuthError("SHIPROCKET_API_BASE environment variable is not set");
  }

  const url = `${apiBase}${path}`;
  const serialisedBody =
    options.body !== undefined ? JSON.stringify(options.body) : undefined;

  const doFetch = async (token: string): Promise<Response> =>
    fetch(url, {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: serialisedBody,
    });

  // ── Initial attempt ────────────────────────────────────────────────────────
  let token = await getShipRocketToken();
  let response = await doFetch(token);

  // ── 401 handling: one re-auth + one retry, then hard-fail ─────────────────
  if (response.status === 401) {
    tokenCache = null;

    try {
      token = await fetchFreshToken();
    } catch (authErr) {
      const msg = authErr instanceof Error ? authErr.message : String(authErr);
      await writeAuditLog(supabase, {
        order_id:        options.orderId,
        shipment_id:     options.shipmentId,
        action:          options.action,
        request_payload: options.body,
        status_code:     401,
        success:         false,
        error_message:   `Re-auth failed after 401: ${msg}`,
        called_by:       options.calledBy,
      });
      throw new AuthError(`ShipRocket re-authentication failed after 401: ${msg}`);
    }

    response = await doFetch(token);

    if (response.status === 401) {
      // Still 401 after a fresh token — credentials are wrong or account is locked.
      // Do not retry again.
      await writeAuditLog(supabase, {
        order_id:        options.orderId,
        shipment_id:     options.shipmentId,
        action:          options.action,
        request_payload: options.body,
        status_code:     401,
        success:         false,
        error_message:   "401 persists after token refresh — check ShipRocket credentials",
        called_by:       options.calledBy,
      });
      throw new AuthError(
        "ShipRocket returned 401 after token refresh. Verify SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD.",
      );
    }
  }

  // ── Parse response and write audit log ────────────────────────────────────
  const responseBody = await response.json().catch(() => null);
  const success = response.ok;

  await writeAuditLog(supabase, {
    order_id:         options.orderId,
    shipment_id:      options.shipmentId,
    action:           options.action,
    request_payload:  options.body,
    response_payload: responseBody,
    status_code:      response.status,
    success,
    error_message: success
      ? undefined
      : `HTTP ${response.status}: ${JSON.stringify(responseBody)}`,
    called_by: options.calledBy,
  });

  if (!success) {
    throw new ShipRocketAPIError(
      `ShipRocket API error [${response.status}] on "${options.action}": ${JSON.stringify(responseBody)}`,
      response.status,
    );
  }

  return responseBody;
}
