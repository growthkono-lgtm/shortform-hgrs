#!/usr/bin/env bash
# 소개서 조판 검사 — 로컬 서버를 띄우고 scripts/deck-doctor.mjs 를 돌린다.
#
#   npm run deck:doctor
#
# `npm run deck` 로 HTML 을 만든 뒤에 돌린다. 인쇄 전 마지막 관문이다.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${DECK_PORT:-8909}"

if [ ! -f "$ROOT/docs/deck/소개서.html" ]; then
  echo "소개서.html 이 없습니다 — 먼저 npm run deck" >&2
  exit 2
fi

python3 -m http.server "$PORT" --directory "$ROOT" >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null || true' EXIT

for _ in $(seq 1 40); do
  curl -sf "http://localhost:$PORT/docs/deck/소개서.html" >/dev/null && break
  sleep 0.25
done

node "$ROOT/scripts/deck-doctor.mjs" "http://localhost:$PORT"
