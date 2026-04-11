#!/usr/bin/env -S npx tsx
/**
 * test-webhook.ts — Simulate ShipRocket webhook events locally
 *
 * USAGE:
 *   npx tsx scripts/test-webhook.ts --event shipped --awb 12345678 [--order-id <uuid>]
 *   npx tsx scripts/test-webhook.ts --event delivered --awb 12345678
 *   npx tsx scripts/test-webhook.ts --event ndr --awb 12345678 --ndr-reason "Customer not available"
 *   npx tsx scripts/test-webhook.ts --event rto --awb 12345678
 *   npx tsx scripts/test-webhook.ts --event out_for_delivery --awb 12345678
 *
 * FLAGS:
 *   --event       Required. One of: shipped, out_for_delivery, delivered, ndr, rto, pickup_error
 *   --awb         Required. The AWB number of the shipment to update.
 *   --order-id    Optional. ShipRocket order ID (not Supabase order ID).
 *   --ndr-reason  Optional. NDR reason string (used with --event ndr).
 *   --url         Optional. Override the webhook URL.
 *                 Default: http://127.0.0.1:54321/functions/v1/shiprocket-webhook
 *   --secret      Optional. Channel secret for signature header.
 *                 Default: reads SHIPROCKET_CHANNEL_SECRET from env.
 *   --dry-run     Print the payload without sending.
 *
 * REQUIREMENTS:
 *   - Supabase local dev running (`supabase start`)
 *   - SHIPROCKET_CHANNEL_SECRET set as env var or passed via --secret
 */

// ── Argument parsing ──────────────────────────────────────────────────────────

function parseArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (key.startsWith("--")) {
      const name = key.slice(2);
      // Boolean flags (no value)
      if (name === "dry-run") {
        args[name] = "true";
        continue;
      }
      const value = argv[i + 1];
      if (value && !value.startsWith("--")) {
        args[name] = value;
        i++;
      } else {
        args[name] = "true";
      }
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));

const EVENT = args["event"];
const AWB = args["awb"];
const ORDER_ID = args["order-id"] || `SR-${Date.now()}`;
const NDR_REASON = args["ndr-reason"] || "Customer not available";
const WEBHOOK_URL =
  args["url"] || "http://127.0.0.1:54321/functions/v1/shiprocket-webhook";
const SECRET =
  args["secret"] || process.env.SHIPROCKET_CHANNEL_SECRET || "";
const DRY_RUN = args["dry-run"] === "true";

// ── Validation ────────────────────────────────────────────────────────────────

const VALID_EVENTS = [
  "shipped",
  "out_for_delivery",
  "delivered",
  "ndr",
  "rto",
  "pickup_error",
] as const;

if (!EVENT || !VALID_EVENTS.includes(EVENT as (typeof VALID_EVENTS)[number])) {
  console.error(
    `ERROR: --event is required. Must be one of: ${VALID_EVENTS.join(", ")}\n`,
  );
  process.exit(1);
}

if (!AWB) {
  console.error("ERROR: --awb is required.\n");
  process.exit(1);
}

if (!SECRET) {
  console.error(
    "WARNING: No channel secret. Set SHIPROCKET_CHANNEL_SECRET env var or pass --secret.\n" +
      "         The webhook will reject the request with 401.\n",
  );
}

// ── Map event to ShipRocket-style status string ───────────────────────────────

const EVENT_TO_STATUS: Record<string, { current_status: string; current_status_id: number }> = {
  shipped:          { current_status: "PICKED UP",         current_status_id: 6 },
  out_for_delivery: { current_status: "OUT FOR DELIVERY",  current_status_id: 17 },
  delivered:        { current_status: "DELIVERED",         current_status_id: 7 },
  ndr:              { current_status: "NDR",               current_status_id: 21 },
  rto:              { current_status: "RTO Delivered",     current_status_id: 14 },
  pickup_error:     { current_status: "PICKUP ERROR",      current_status_id: 19 },
};

// ── Build payload ─────────────────────────────────────────────────────────────

const statusInfo = EVENT_TO_STATUS[EVENT];

interface WebhookPayload {
  awb: string;
  order_id: string;
  shipment_id: string;
  current_status: string;
  current_status_id: number;
  courier_name: string;
  etd: string;
  updated_at: string;
  ndr_reason?: string;
  ndr_status?: string;
  [key: string]: unknown;
}

const payload: WebhookPayload = {
  awb: AWB,
  order_id: ORDER_ID,
  shipment_id: `SH-${ORDER_ID}`,
  current_status: statusInfo.current_status,
  current_status_id: statusInfo.current_status_id,
  courier_name: "Test Courier (Simulated)",
  etd: new Date(Date.now() + 3 * 24 * 3600_000).toISOString(),
  updated_at: new Date().toISOString(),
};

if (EVENT === "ndr") {
  payload.ndr_reason = NDR_REASON;
  payload.ndr_status = "ndr";
}

// ── Send ──────────────────────────────────────────────────────────────────────

console.log("┌─────────────────────────────────────────┐");
console.log("│  ShipRocket Webhook Test                │");
console.log("└─────────────────────────────────────────┘");
console.log(`  Event:    ${EVENT}`);
console.log(`  AWB:      ${AWB}`);
console.log(`  Status:   ${statusInfo.current_status}`);
console.log(`  URL:      ${WEBHOOK_URL}`);
console.log(`  Secret:   ${SECRET ? SECRET.slice(0, 4) + "..." : "(none)"}`);
console.log();
console.log("Payload:");
console.log(JSON.stringify(payload, null, 2));
console.log();

if (DRY_RUN) {
  console.log("DRY RUN — not sending.\n");
  process.exit(0);
}

async function sendWebhook(): Promise<void> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (SECRET) {
      headers["x-shiprocket-signature"] = SECRET;
    }

    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const body = await res.text();

    console.log(`Response: ${res.status} ${res.statusText}`);
    try {
      console.log(JSON.stringify(JSON.parse(body), null, 2));
    } catch {
      console.log(body);
    }

    if (res.status === 200) {
      console.log("\n✓ Webhook accepted.");
    } else if (res.status === 401) {
      console.log("\n✗ Signature rejected. Check your --secret / SHIPROCKET_CHANNEL_SECRET.");
    } else {
      console.log(`\n✗ Unexpected status ${res.status}.`);
    }
  } catch (err) {
    console.error("\nFailed to reach webhook endpoint:");
    console.error(err instanceof Error ? err.message : String(err));
    console.error("\nIs Supabase local running? (`supabase start`)");
    process.exit(1);
  }
}

sendWebhook();
