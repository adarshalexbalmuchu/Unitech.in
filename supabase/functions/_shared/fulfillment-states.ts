/**
 * Fulfillment state machine for ShipRocket integration.
 *
 * All fulfillment_status updates — whether from webhooks, Edge Functions,
 * or admin actions — must call assertValidTransition() before writing to
 * the DB. This is the single source of truth for legal state changes.
 *
 * Illegal transitions are rejected with a typed IllegalTransitionError.
 * The webhook handler must log illegal incoming transitions as anomalous
 * and return 200 to ShipRocket (to stop retries) without applying the update.
 */

// ─── Status type ─────────────────────────────────────────────────────────────

export type FulfillmentStatus =
  | "pending"           // Order paid; ShipRocket push not yet attempted
  | "sr_push_failed"    // ShipRocket push failed; retry queue will re-attempt
  | "courier_pending"   // Admin override: awaiting manual courier selection
  | "processing"        // ShipRocket order created; AWB assigned
  | "shipped"           // Package picked up by courier
  | "out_for_delivery"  // Out for delivery on current attempt
  | "delivered"         // Successfully delivered — terminal
  | "ndr_pending"       // Delivery attempt failed; awaiting admin/customer action
  | "rto"               // Return to origin initiated by ShipRocket
  | "returned"          // Package returned to warehouse — terminal
  | "cancelled"         // Order cancelled — terminal
  | "manual_review";    // Retry exhausted; requires human intervention

// ─── Legal transition map ─────────────────────────────────────────────────────

export const LEGAL_TRANSITIONS: Record<FulfillmentStatus, FulfillmentStatus[]> = {
  pending:          ["processing", "sr_push_failed", "cancelled"],
  sr_push_failed:   ["pending", "processing", "manual_review",  "cancelled"],
  courier_pending:  ["processing", "cancelled"],
  processing:       ["shipped",    "cancelled"],
  shipped:          ["out_for_delivery", "returned"],
  out_for_delivery: ["delivered",  "ndr_pending"],
  ndr_pending:      ["out_for_delivery", "rto"],
  rto:              ["returned"],
  returned:         [],
  delivered:        [],
  cancelled:        [],
  manual_review:    ["pending", "processing", "cancelled"],
};

// ─── Typed error ──────────────────────────────────────────────────────────────

export class IllegalTransitionError extends Error {
  readonly current: FulfillmentStatus;
  readonly next: FulfillmentStatus;

  constructor(current: FulfillmentStatus, next: FulfillmentStatus) {
    super(`Illegal fulfillment transition: "${current}" → "${next}"`);
    this.name = "IllegalTransitionError";
    this.current = current;
    this.next = next;
  }
}

// ─── Exported guards ──────────────────────────────────────────────────────────

/**
 * Returns true if transitioning from `current` to `next` is legal.
 * Returns false for any unknown status value.
 */
export function isValidTransition(
  current: FulfillmentStatus,
  next: FulfillmentStatus,
): boolean {
  return (LEGAL_TRANSITIONS[current] ?? []).includes(next);
}

/**
 * Throws IllegalTransitionError if the transition is not in LEGAL_TRANSITIONS.
 * Call this before every fulfillment_status DB write.
 *
 * @example
 * assertValidTransition(shipment.fulfillment_status, "shipped");
 * await supabase.from("shipments").update({ fulfillment_status: "shipped" })...
 */
export function assertValidTransition(
  current: FulfillmentStatus,
  next: FulfillmentStatus,
): void {
  if (!isValidTransition(current, next)) {
    throw new IllegalTransitionError(current, next);
  }
}
