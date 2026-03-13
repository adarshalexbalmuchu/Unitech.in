#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  bash scripts/live-verification-kit.sh unauth-payment
  bash scripts/live-verification-kit.sh non-admin-mutation

Required env vars (all commands):
  SUPABASE_PROJECT_URL   e.g. https://<project-ref>.supabase.co
  SUPABASE_ANON_KEY      anon/publishable key

Additional env vars for non-admin-mutation:
  NON_ADMIN_JWT          valid JWT for non-admin authenticated user
  TEST_PRODUCT_ID        existing product row id
  SUPABASE_SERVICE_ROLE_KEY  service role key (only for verification read)

Expected results:
  unauth-payment:
    - create-razorpay-order => HTTP 401
    - verify-razorpay-payment => HTTP 401
  non-admin-mutation:
    - mutation must NOT change product price
    - direct mutation response should be HTTP 401/403 or 200/204 with zero affected rows
EOF
}

require_var() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "❌ Missing required env var: $name" >&2
    exit 1
  fi
}

http_call() {
  local method="$1"
  local url="$2"
  local payload="$3"
  shift 3

  curl -sS -X "$method" "$url" \
    -H "Content-Type: application/json" \
    "$@" \
    --data "$payload" \
    -w "\nHTTP_STATUS:%{http_code}"
}

extract_status() {
  awk -F: '/HTTP_STATUS/{print $2}'
}

extract_body() {
  sed '/HTTP_STATUS:/d'
}

run_unauth_payment() {
  require_var SUPABASE_PROJECT_URL
  require_var SUPABASE_ANON_KEY

  local base="$SUPABASE_PROJECT_URL/functions/v1"

  local create_payload
  create_payload='{"idempotencyKey":"unauth-test","items":[{"productId":"test","quantity":1}],"shipping":{"name":"X","email":"x@example.com","phone":"9999999999","address":"x","city":"x","state":"x","pincode":"000000"}}'

  local verify_payload
  verify_payload='{"orderId":"00000000-0000-0000-0000-000000000000","razorpayOrderId":"order_x","razorpayPaymentId":"pay_x","razorpaySignature":"sig_x"}'

  local create_resp
  create_resp=$(http_call POST "$base/create-razorpay-order" "$create_payload" -H "apikey: $SUPABASE_ANON_KEY")
  local create_status
  create_status=$(printf '%s' "$create_resp" | extract_status)

  local verify_resp
  verify_resp=$(http_call POST "$base/verify-razorpay-payment" "$verify_payload" -H "apikey: $SUPABASE_ANON_KEY")
  local verify_status
  verify_status=$(printf '%s' "$verify_resp" | extract_status)

  echo "create-razorpay-order status: $create_status"
  echo "verify-razorpay-payment status: $verify_status"

  if [[ "$create_status" == "401" && "$verify_status" == "401" ]]; then
    echo "✅ PASS: unauthenticated payment function calls are rejected"
    exit 0
  fi

  echo "❌ FAIL: expected both statuses to be 401"
  echo "create body:"
  printf '%s\n' "$create_resp" | extract_body
  echo "verify body:"
  printf '%s\n' "$verify_resp" | extract_body
  exit 1
}

run_non_admin_mutation() {
  require_var SUPABASE_PROJECT_URL
  require_var SUPABASE_ANON_KEY
  require_var NON_ADMIN_JWT
  require_var TEST_PRODUCT_ID
  require_var SUPABASE_SERVICE_ROLE_KEY

  local rest_base="$SUPABASE_PROJECT_URL/rest/v1/products"

  local before
  before=$(curl -sS "$rest_base?id=eq.$TEST_PRODUCT_ID&select=id,price" \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")

  local before_price
  before_price=$(printf '%s' "$before" | grep -o '"price":[0-9.]*' | head -n1 | cut -d: -f2)

  if [[ -z "$before_price" ]]; then
    echo "❌ FAIL: could not read baseline product price; verify TEST_PRODUCT_ID and service key"
    echo "response: $before"
    exit 1
  fi

  local sentinel_price="9876543"
  local mutate_payload
  mutate_payload="{\"price\":$sentinel_price}"

  local mutate_resp
  mutate_resp=$(http_call PATCH "$rest_base?id=eq.$TEST_PRODUCT_ID" "$mutate_payload" \
    -H "apikey: $SUPABASE_ANON_KEY" \
    -H "Authorization: Bearer $NON_ADMIN_JWT" \
    -H "Prefer: return=representation")
  local mutate_status
  mutate_status=$(printf '%s' "$mutate_resp" | extract_status)
  local mutate_body
  mutate_body=$(printf '%s' "$mutate_resp" | extract_body)

  local after
  after=$(curl -sS "$rest_base?id=eq.$TEST_PRODUCT_ID&select=id,price" \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")

  local after_price
  after_price=$(printf '%s' "$after" | grep -o '"price":[0-9.]*' | head -n1 | cut -d: -f2)

  echo "mutation status: $mutate_status"
  echo "before price: $before_price"
  echo "after price:  $after_price"

  if [[ "$before_price" == "$after_price" ]]; then
    case "$mutate_status" in
      401|403|200|204)
        echo "✅ PASS: non-admin direct product mutation did not change data"
        echo "mutation response body: $mutate_body"
        exit 0
        ;;
    esac
  fi

  echo "❌ FAIL: product price changed or mutation response unexpected"
  echo "mutation response body: $mutate_body"
  exit 1
}

main() {
  local cmd="${1:-}"
  case "$cmd" in
    unauth-payment)
      run_unauth_payment
      ;;
    non-admin-mutation)
      run_non_admin_mutation
      ;;
    *)
      usage
      exit 1
      ;;
  esac
}

main "$@"
