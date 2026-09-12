#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${1:-}"
INNER_PATH="${2:-/}"
if [[ -z "$DOMAIN" ]]; then
  echo "Usage: live-release-gate.sh <domain> [answer-page-path]" >&2
  exit 2
fi
DOMAIN="${DOMAIN#https://}"
DOMAIN="${DOMAIN#http://}"
DOMAIN="${DOMAIN%%/*}"
BASE="https://${DOMAIN}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

check_200() {
  local path="$1"
  local code
  local attempt
  for attempt in {1..12}; do
    code="$(curl -L --connect-timeout 15 --max-time 45 -sS -H 'Cache-Control: no-cache' -o "$TMP/body" -w '%{http_code}' "${BASE}${path}")" || code=000
    [[ "$code" == "200" ]] && return 0
    echo "live gate: ${path} returned ${code}; propagation check ${attempt}/12" >&2
    [[ "$attempt" == 12 ]] || sleep 10
  done
  echo "live gate: ${path} remained unavailable after bounded retries" >&2
  return 1
}

for path in / /sitemap.xml /robots.txt "$INNER_PATH"; do
  check_200 "$path"
done

curl -L --connect-timeout 15 --max-time 45 -fsS "$BASE/" -o "$TMP/home.html"
curl -L --connect-timeout 15 --max-time 45 -fsS "${BASE}${INNER_PATH}" -o "$TMP/inner.html"

grep -Fq "${BASE}" "$TMP/home.html" || { echo "live gate: production canonical origin missing" >&2; exit 1; }
grep -Fq "data-primary-task" "$TMP/home.html" || { echo "live gate: primary task marker missing on production" >&2; exit 1; }
if [[ "$INNER_PATH" != "/" ]]; then
  grep -Fq "data-quick-answer" "$TMP/inner.html" || { echo "live gate: expected inner-page quick-answer marker missing on production" >&2; exit 1; }
fi

for phrase in "00:00" "Google Suggest demand" "gameplay review" "launch build" "route evidence" "should be added later"; do
  if grep -Fiq "$phrase" "$TMP/home.html" "$TMP/inner.html"; then
    echo "live gate: forbidden production phrase found: ${phrase}" >&2
    exit 1
  fi
done

check_200 /favicon.ico
if [[ -n "${EXPECTED_GA_ID:-}" ]]; then
  grep -Fq "$EXPECTED_GA_ID" "$TMP/home.html" || { echo "live gate: expected GA4 id missing" >&2; exit 1; }
fi
if [[ -n "${EXPECTED_GSC_TOKEN:-}" ]]; then
  grep -Fq "$EXPECTED_GSC_TOKEN" "$TMP/home.html" || { echo "live gate: expected GSC token missing" >&2; exit 1; }
fi

printf '{"live_release_gate":"ok","domain":"%s","innerPath":"%s"}\n' "$DOMAIN" "$INNER_PATH"
