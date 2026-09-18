#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${1:-}"
shift || true
[[ -n "$DOMAIN" ]] || { echo "Usage: canonical-origin-check.sh <domain> [path ...]" >&2; exit 2; }
[[ "$DOMAIN" =~ ^[a-z0-9][a-z0-9.-]*[a-z0-9]$ ]] || { echo "ERROR: invalid domain: $DOMAIN" >&2; exit 2; }

paths=("/")
for path in "$@"; do
  [[ "$path" == /* ]] || path="/${path}"
  path="/${path#/}"
  [[ "$path" == "/" ]] || path="${path%/}/"
  paths+=("$path")
done

check_redirect() {
  local source_url="$1"
  shift
  local result status location attempt expected
  for attempt in 1 2 3 4 5 6; do
    result="$(curl -sS --max-time 30 -o /dev/null -w $'%{http_code}\t%{redirect_url}' "$source_url")"
    status="${result%%$'\t'*}"
    location="${result#*$'\t'}"
    if [[ "$status" =~ ^(301|307|308)$ ]]; then
      for expected in "$@"; do
        if [[ "$location" == "$expected" ]]; then
          echo "redirect=$source_url status=$status location=$location attempt=$attempt"
          return 0
        fi
      done
    fi
    if (( attempt < 6 )); then sleep 5; fi
  done
  echo "ERROR: $source_url returned $status -> $location; expected 301/307/308 -> $*" >&2
  return 1
}

check_redirect "http://${DOMAIN}/" "https://${DOMAIN}/"
check_redirect "http://www.${DOMAIN}/" "https://${DOMAIN}/"
check_redirect "https://www.${DOMAIN}/" "https://${DOMAIN}/"

for path in "${paths[@]}"; do
  [[ "$path" == "/" ]] && continue
  no_slash="${path%/}"
  # Cloudflare's HTTP->HTTPS edge redirect can run before the Worker trailing-slash
  # redirect, so allow the intermediate HTTPS/no-slash URL while separately checking
  # that the HTTPS apex URL normalizes to the canonical trailing-slash path.
  check_redirect "http://${DOMAIN}${no_slash}" "https://${DOMAIN}${path}" "https://${DOMAIN}${no_slash}"
  check_redirect "http://www.${DOMAIN}${no_slash}" "https://${DOMAIN}${path}" "https://${DOMAIN}${no_slash}"
  check_redirect "https://www.${DOMAIN}${no_slash}" "https://${DOMAIN}${path}" "https://${DOMAIN}${no_slash}"
  check_redirect "https://${DOMAIN}${no_slash}" "https://${DOMAIN}${path}"
done

body_file="$(mktemp)"
trap 'rm -f "$body_file"' EXIT
apex_status="$(curl -sS --max-time 30 -o "$body_file" -w '%{http_code}' "https://${DOMAIN}/")"
[[ "$apex_status" == "200" ]] || { echo "ERROR: https://${DOMAIN}/ returned $apex_status; expected 200" >&2; exit 1; }

python3 - "$body_file" "$DOMAIN" <<'PY'
import re
import sys

body = open(sys.argv[1], encoding="utf-8").read()
domain = sys.argv[2]
match = re.search(r'<link[^>]+rel=["\']canonical["\'][^>]+href=["\']([^"\']+)["\']|<link[^>]+href=["\']([^"\']+)["\'][^>]+rel=["\']canonical["\']', body, re.I)
canonical = (match.group(1) or match.group(2)) if match else ""
expected = f"https://{domain}/"
accepted = {expected, expected.rstrip("/")}
if canonical not in accepted:
    raise SystemExit(f"ERROR: apex canonical is {canonical or '(missing)'}; expected {expected} or {expected.rstrip('/')}")
print(f"apex=https://{domain}/ status=200 canonical={canonical}")
PY

echo "canonical_origin_check=ok domain=${DOMAIN}"
