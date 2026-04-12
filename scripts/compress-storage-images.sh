#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────────────
# compress-storage-images.sh
#
# Downloads all product images from Supabase Storage, converts to
# optimized WebP, re-uploads, and updates the DB image URLs.
#
# Requires: cwebp (from webp package), jq, curl
# Usage:    bash scripts/compress-storage-images.sh
#
# SAFETY: Creates backups in tmp/image-backup/ before modification.
#         Processes images one-by-one with verification.
# ────────────────────────────────────────────────────────────────────

set -euo pipefail

BUCKET="product-images"
SUPABASE_URL="${SUPABASE_URL:-$(npx supabase --experimental status --linked -o json 2>/dev/null | jq -r '.api.url // empty')}"
SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"

if [[ -z "$SUPABASE_URL" ]]; then
  echo "❌ SUPABASE_URL not set. Export it or link your project."
  exit 1
fi
if [[ -z "$SERVICE_ROLE_KEY" ]]; then
  echo "❌ SUPABASE_SERVICE_ROLE_KEY not set. Export it first:"
  echo "   export SUPABASE_SERVICE_ROLE_KEY='your-key'"
  exit 1
fi

# Check dependencies
for cmd in cwebp jq curl; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "❌ Missing dependency: $cmd"
    [[ "$cmd" == "cwebp" ]] && echo "   Install: sudo apt-get install -y webp"
    exit 1
  fi
done

STORAGE_BASE="$SUPABASE_URL/storage/v1/object"
AUTH_HEADER="Authorization: Bearer $SERVICE_ROLE_KEY"
BACKUP_DIR="tmp/image-backup"
WORK_DIR="tmp/image-work"
mkdir -p "$BACKUP_DIR" "$WORK_DIR"

echo "📦 Listing images in bucket '$BUCKET'..."
FILES=$(curl -s -H "$AUTH_HEADER" \
  "$SUPABASE_URL/storage/v1/object/list/$BUCKET" \
  -H "Content-Type: application/json" \
  -d '{"prefix":"","limit":500,"offset":0,"sortBy":{"column":"name","order":"asc"}}' \
  | jq -r '.[] | select(.name != ".emptyFolderPlaceholder") | .name')

TOTAL=$(echo "$FILES" | wc -l)
echo "📁 Found $TOTAL files"

CONVERTED=0
SKIPPED=0
FAILED=0
SAVED_BYTES=0

for FILE in $FILES; do
  EXT="${FILE##*.}"
  BASE="${FILE%.*}"
  WEBP_NAME="${BASE}.webp"

  # Skip if already WebP
  if [[ "${EXT,,}" == "webp" ]]; then
    ((SKIPPED++))
    continue
  fi

  echo -n "  [$((CONVERTED + SKIPPED + FAILED + 1))/$TOTAL] $FILE → $WEBP_NAME ... "

  # Download original
  HTTP_CODE=$(curl -s -o "$WORK_DIR/$FILE" -w "%{http_code}" \
    "$STORAGE_BASE/public/$BUCKET/$FILE")
  if [[ "$HTTP_CODE" != "200" ]]; then
    echo "SKIP (download failed: $HTTP_CODE)"
    ((FAILED++))
    continue
  fi

  ORIG_SIZE=$(stat -c%s "$WORK_DIR/$FILE")

  # Backup
  cp "$WORK_DIR/$FILE" "$BACKUP_DIR/$FILE"

  # Convert to WebP (quality 80, max 1200px wide)
  if ! cwebp -q 80 -resize 1200 0 "$WORK_DIR/$FILE" -o "$WORK_DIR/$WEBP_NAME" 2>/dev/null; then
    echo "SKIP (conversion failed)"
    ((FAILED++))
    continue
  fi

  WEBP_SIZE=$(stat -c%s "$WORK_DIR/$WEBP_NAME")
  SAVINGS=$((ORIG_SIZE - WEBP_SIZE))

  # Only upload if WebP is actually smaller
  if [[ $WEBP_SIZE -ge $ORIG_SIZE ]]; then
    echo "SKIP (WebP not smaller)"
    rm -f "$WORK_DIR/$WEBP_NAME"
    ((SKIPPED++))
    continue
  fi

  # Upload WebP
  UPLOAD_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST \
    -H "$AUTH_HEADER" \
    -H "Content-Type: image/webp" \
    -H "x-upsert: true" \
    --data-binary "@$WORK_DIR/$WEBP_NAME" \
    "$STORAGE_BASE/$BUCKET/$WEBP_NAME")

  if [[ "$UPLOAD_CODE" != "200" ]]; then
    echo "FAIL (upload: $UPLOAD_CODE)"
    ((FAILED++))
    continue
  fi

  # Update DB references (image_url and images array)
  OLD_URL="$STORAGE_BASE/public/$BUCKET/$FILE"
  NEW_URL="$STORAGE_BASE/public/$BUCKET/$WEBP_NAME"

  curl -s -o /dev/null \
    -H "$AUTH_HEADER" \
    -H "Content-Type: application/json" \
    -H "apikey: $SERVICE_ROLE_KEY" \
    -H "Prefer: return=minimal" \
    -X PATCH \
    "$SUPABASE_URL/rest/v1/products?image_url=eq.${OLD_URL}" \
    -d "{\"image_url\": \"$NEW_URL\"}"

  # Delete original from storage (free up space)
  curl -s -o /dev/null \
    -X DELETE \
    -H "$AUTH_HEADER" \
    "$STORAGE_BASE/$BUCKET/$FILE"

  SAVED_BYTES=$((SAVED_BYTES + SAVINGS))
  REDUCTION=$((SAVINGS * 100 / ORIG_SIZE))
  echo "✅ -${REDUCTION}% ($(numfmt --to=iec $ORIG_SIZE) → $(numfmt --to=iec $WEBP_SIZE))"
  ((CONVERTED++))

  # Clean up work files
  rm -f "$WORK_DIR/$FILE" "$WORK_DIR/$WEBP_NAME"
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Converted: $CONVERTED"
echo "⏭️  Skipped:   $SKIPPED"
echo "❌ Failed:    $FAILED"
echo "💾 Space saved: $(numfmt --to=iec $SAVED_BYTES)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  NOTE: You also need to update the 'images' JSONB array in the products"
echo "   table. Run this SQL to bulk-replace .png/.jpg with .webp:"
echo ""
echo "   UPDATE products"
echo "   SET images = regexp_replace(images::text, '\\.(png|jpg|jpeg)', '.webp', 'gi')::jsonb"
echo "   WHERE images::text ~ '\\.(png|jpg|jpeg)';"
echo ""
echo "   Backups are in: $BACKUP_DIR/"
