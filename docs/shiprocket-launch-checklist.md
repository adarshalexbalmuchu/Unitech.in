# ShipRocket Launch Checklist

> Plain-language guide for the warehouse manager + developer to go from
> sandbox to production in a single pass.

---

## 1. Before You Go Live

### Environment Variables (Developer)

| Variable | Where to set | Notes |
|----------|-------------|-------|
| `SHIPROCKET_API_BASE` | `supabase secrets set` | `https://apiv2.shiprocket.in/v1/external` (same for sandbox & prod — environment is controlled by ShipRocket credentials) |
| `SHIPROCKET_EMAIL` | `supabase secrets set` | Your ShipRocket login email |
| `SHIPROCKET_PASSWORD` | `supabase secrets set` | Your ShipRocket login password |
| `SHIPROCKET_CHANNEL_SECRET` | `supabase secrets set` | From ShipRocket dashboard → Settings → API → Webhooks |
| `SHIPROCKET_WAREHOUSE_PINCODE` | `supabase secrets set` | 6-digit pincode of your warehouse |
| `SHIPROCKET_PICKUP_LOCATION_NAME` | `supabase secrets set` | Must match exactly the pickup location name in ShipRocket dashboard (Settings → Manage Pickups) |

### ShipRocket Dashboard Setup (Warehouse Manager + Developer)

- [ ] **Create pickup location** — Settings → Manage Pickups → Add. Note the exact name you enter — it goes into `SHIPROCKET_PICKUP_LOCATION_NAME`.
- [ ] **Enable webhook** — Settings → API → Webhooks → Add. Enter your Supabase Function URL:
  ```
  https://<your-project>.supabase.co/functions/v1/shiprocket-webhook
  ```
  Copy the "Channel Secret" and set it as `SHIPROCKET_CHANNEL_SECRET`.
- [ ] **Verify product dimensions** — Every product in the database must have `weight_kg`, `length_cm`, `width_cm`, `height_cm` filled in. ShipRocket will reject orders without dimensions.
- [ ] **Verify HSN codes** — `hsn_code` on each product. Required for tax invoices.
- [ ] **Product SKUs** — Each product needs a unique `sku`. ShipRocket uses SKU to identify items.

### Database Migrations (Developer)

Run all migrations in order:

```bash
supabase db push
```

Verify these tables/columns exist:
- [ ] `orders.fulfillment_status` column
- [ ] `orders.cancellation_deadline` column
- [ ] `orders.retry_count` column
- [ ] `shipments` table with all columns
- [ ] `ndr_actions` table
- [ ] `shiprocket_audit_log` table
- [ ] `shiprocket_event_log` table
- [ ] `courier_config` table

### Cron Jobs (Developer)

- [ ] `pg_cron` extension enabled (`supabase db push` handles this)
- [ ] Nightly PII redaction job active — check with:
  ```sql
  SELECT * FROM cron.job;
  ```
- [ ] Retry cron: Deploy `retry-shiprocket-orders` Edge Function. Set up an external cron (e.g. GitHub Actions, cron-job.org) to call it every 10 minutes:
  ```
  POST https://<project>.supabase.co/functions/v1/retry-shiprocket-orders
  Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
  ```

### Edge Functions (Developer)

Deploy all functions:

```bash
supabase functions deploy create-shiprocket-order
supabase functions deploy retry-shiprocket-orders
supabase functions deploy shiprocket-webhook
supabase functions deploy track-shipment
supabase functions deploy check-serviceability
supabase functions deploy generate-label
supabase functions deploy schedule-pickup
supabase functions deploy generate-manifest
supabase functions deploy get-admin-orders
supabase functions deploy push-to-shiprocket
supabase functions deploy redact-shiprocket-pii
supabase functions deploy export-reconciliation
supabase functions deploy get-ndr-queue
supabase functions deploy resolve-ndr
supabase functions deploy cancel-order
```

### Smoke Test (Developer)

1. Place a test order on the site
2. Check the `orders` table — `fulfillment_status` should move to `processing`
3. Check the `shipments` table — a row should appear with `awb_number`
4. Run the webhook test script:
   ```bash
   npx tsx scripts/test-webhook.ts --event shipped --awb <awb_from_step_3> --secret <your_secret>
   ```
5. Verify `shipments.fulfillment_status` changed to `shipped`
6. Check admin panel at `/admin/orders` — order should show "Shipped"

---

## 2. Daily Operations (Warehouse Manager)

### Morning Routine

1. **Open Admin Panel** → `/admin/orders`
2. **Check the "Stuck" tab** — these are orders that failed to push to ShipRocket. Click "Push to SR" to retry.
3. **Check NDR Queue tab** — these are failed delivery attempts. For each:
   - **Re-attempt**: Click if customer confirms they'll be available
   - **Update Address**: Click if customer gives corrected address
   - **Accept Return**: Click if customer wants refund / you can't deliver
4. **Process new orders** — For "Processing" orders:
   - Click **Label** to generate the shipping label
   - Click **Pickup** to schedule courier pickup (select the pickup date)
   - Click **Manifest** to generate the manifest (do this after all pickups are scheduled)
5. **Print labels** — Click the label link in each order row to download the PDF

### When a Customer Asks "Where Is My Order?"

1. Find the order by searching the order ID or customer name in admin
2. The AWB number and courier name are visible in the orders table
3. Click "Track" to see the courier's tracking page
4. Customer can also track at: `/track/<order-id>` on your website

### When a Customer Wants to Cancel

- Customers can cancel from "My Orders" on the website within the cancellation window
- After the window expires, they must contact you
- You can manually cancel by running:
  ```
  UPDATE orders SET fulfillment_status = 'cancelled' WHERE id = '<order-id>';
  ```

---

## 3. Monitoring (Developer)

### Key Tables to Watch

| Table | What to look for |
|-------|-----------------|
| `orders` WHERE `fulfillment_status = 'sr_push_failed'` | Orders that failed to push. The retry cron handles these, but check if count is growing. |
| `orders` WHERE `fulfillment_status = 'manual_review'` | Orders that exhausted all retries. Need manual "Push to SR" from admin. |
| `ndr_actions` WHERE `action_taken IS NULL` | Open NDR actions awaiting admin resolution. |
| `shiprocket_audit_log` WHERE `success = false` | Failed ShipRocket API calls. Look for patterns. |
| `shiprocket_event_log` | All webhook events received. Check for duplicate `event_id` rejections. |

### Alerts to Set Up

- **sr_push_failed count > 5**: Something may be wrong with ShipRocket credentials or API
- **manual_review count > 0**: Needs human attention
- **NDR open > 36 hours**: Auto-RTO risk — ShipRocket may auto-return the shipment
- **Audit log errors spike**: ShipRocket API may be down

### Monthly Reconciliation

1. Go to Admin Panel → Reports tab
2. Select the month
3. Click "Download CSV"
4. Compare with your ShipRocket invoice
5. Fill in the blank columns for any manual adjustments

---

## 4. Emergency Procedures

### ShipRocket API Is Down

- Orders will queue with `sr_push_failed` status
- The retry cron will automatically retry every 10 minutes
- No action needed unless it lasts > 1 hour
- If > 1 hour: Check [ShipRocket Status](https://status.shiprocket.in/) and wait

### Webhook Stopped Receiving Events

1. Check ShipRocket dashboard → Webhooks → verify URL is correct
2. Check Supabase Edge Function logs:
   ```bash
   supabase functions logs shiprocket-webhook
   ```
3. Verify `SHIPROCKET_CHANNEL_SECRET` matches what's in ShipRocket dashboard
4. Check `shiprocket_event_log` for recent entries — if empty, ShipRocket isn't sending

### Token Refresh Failing

- The auth module caches tokens for 23h 55m and auto-refreshes
- If you see repeated 401 errors in the audit log:
  1. Verify `SHIPROCKET_EMAIL` and `SHIPROCKET_PASSWORD` are correct
  2. Log into ShipRocket manually to confirm credentials work
  3. Redeploy the Edge Functions to clear the cached token

### Database Is Full / Slow

- Run PII redaction manually:
  ```bash
  curl -X POST https://<project>.supabase.co/functions/v1/redact-shiprocket-pii \
    -H "Authorization: Bearer <SERVICE_ROLE_KEY>"
  ```
- Archive old `shiprocket_event_log` and `shiprocket_audit_log` entries (> 90 days)

---

## Quick Reference: Order Status Flow

```
pending → processing → shipped → out_for_delivery → delivered
    │                                    │
    └→ sr_push_failed → manual_review    └→ ndr_pending → out_for_delivery (re-attempt)
                                                │
                                                └→ rto (return to origin)
                                         
cancelled (user-initiated, within deadline)
```
