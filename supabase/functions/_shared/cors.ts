/**
 * Shared CORS helpers for Edge Functions.
 *
 * Uses the ALLOWED_ORIGINS environment variable (comma-separated) to restrict
 * which origins can call the function. If ALLOWED_ORIGINS is not set, falls
 * back to reflecting the request origin (open — suitable for dev only).
 *
 * Usage:
 *   import { buildCorsHeaders, handleCorsPreflightOrReject } from "../_shared/cors.ts";
 *
 *   Deno.serve(async (req) => {
 *     const cors = handleCorsPreflightOrReject(req);
 *     if (cors) return cors;               // OPTIONS preflight or rejected origin
 *     const headers = buildCorsHeaders(req);
 *     // ... use `headers` in every Response
 *   });
 */

declare const Deno: {
  env: { get: (key: string) => string | undefined };
};

const allowedOrigins: string[] = (Deno.env.get("ALLOWED_ORIGINS") || "")
  .split(",")
  .map((o: string) => o.trim())
  .filter(Boolean);

/**
 * Build CORS response headers for a given request.
 * If ALLOWED_ORIGINS is set, only those origins get reflected.
 * Otherwise the request origin is reflected (open mode).
 */
export function buildCorsHeaders(
  req: Request,
  methods = "POST, GET, OPTIONS",
): Record<string, string> {
  const origin = req.headers.get("origin");
  const allowedOrigin =
    allowedOrigins.length > 0
      ? origin && allowedOrigins.includes(origin)
        ? origin
        : allowedOrigins[0]
      : origin || "*";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": methods,
    Vary: "Origin",
  };
}

/**
 * Handle OPTIONS preflight or reject disallowed origins.
 * Returns a Response if the request should be short-circuited, or null to continue.
 */
export function handleCorsPreflightOrReject(req: Request): Response | null {
  const headers = buildCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  const origin = req.headers.get("origin");
  if (origin && allowedOrigins.length > 0 && !allowedOrigins.includes(origin)) {
    return new Response(JSON.stringify({ error: "Origin not allowed" }), {
      status: 403,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  return null;
}
