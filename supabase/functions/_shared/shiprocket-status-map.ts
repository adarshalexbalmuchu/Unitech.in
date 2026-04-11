/**
 * Maps ShipRocket webhook `current_status` strings to the internal
 * FulfillmentStatus enum used across the fulfilment layer.
 *
 * USAGE
 * ─────
 *   import { mapShipRocketStatus } from "../_shared/shiprocket-status-map.ts";
 *
 *   const mapped = mapShipRocketStatus(payload.current_status);
 *   if (!mapped) { /* unknown status — log and return 200 *\/ }
 *
 * The map is intentionally maintained as a single constant so every new
 * ShipRocket status string only needs a one-line addition here.
 * The lookup is case-insensitive and whitespace-trimmed.
 */

import type { FulfillmentStatus } from "./fulfillment-states.ts";

// ─── Canonical mapping ───────────────────────────────────────────────────────
// Keys are LOWER-CASED for case-insensitive lookup.
// Values are the matching FulfillmentStatus enum members.

export const STATUS_MAP: Record<string, FulfillmentStatus> = {
  "pickup scheduled":   "processing",
  "pickup generated":   "processing",
  "pickup queued":      "processing",
  "manifested":         "processing",
  "pickup rescheduled": "processing",
  "awb assigned":       "processing",

  "in transit":         "shipped",
  "shipped":            "shipped",

  "out for delivery":   "out_for_delivery",

  "delivered":          "delivered",

  "cancelled":          "cancelled",

  "rto initiated":      "rto",
  "rto in transit":     "rto",

  "rto delivered":      "returned",

  "ndr":                "ndr_pending",

  "pickup error":       "sr_push_failed",
};

// ─── Exported lookup function ────────────────────────────────────────────────

/**
 * Maps a raw ShipRocket status string to the internal FulfillmentStatus.
 *
 * @param rawStatus  The `current_status` value from the ShipRocket webhook payload.
 * @returns          The matching FulfillmentStatus, or `null` if the status
 *                   string is not recognised. Callers should log unknown
 *                   statuses and return 200 without updating state.
 */
export function mapShipRocketStatus(
  rawStatus: string | null | undefined,
): FulfillmentStatus | null {
  if (!rawStatus) return null;
  const normalised = rawStatus.trim().toLowerCase();
  return STATUS_MAP[normalised] ?? null;
}
