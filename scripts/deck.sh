#!/usr/bin/env bash
# 소개서 PDF 빌드.
#
#   npm run deck
#
# HTML을 만들고, 로컬 정적 서버를 띄운 뒤 Chrome 헤드리스로 A4 PDF를 인쇄한다.
# file:// 로 바로 인쇄해도 되지만, 그러면 같은 파일을 브라우저에서 열어
# 조판을 눈으로 확인할 수가 없다 — 그래서 http 로 통일한다.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${DECK_PORT:-8909}"
OUT="$ROOT/docs/deck/해그로시_스튜디오_종합소개서.pdf"
PUB="$ROOT/public/hgrs-studio-brochure.pdf"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

mkdir -p "$ROOT/docs/deck"

DECK_BASE="http://localhost:$PORT" npx tsx --tsconfig "$ROOT/tsconfig.json" "$ROOT/scripts/build-deck.ts"

python3 -m http.server "$PORT" --directory "$ROOT" >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null || true' EXIT

# 서버가 뜰 때까지 기다린다 — 바로 인쇄하면 빈 페이지가 나온다
for _ in $(seq 1 40); do
  curl -sf "http://localhost:$PORT/docs/deck/소개서.html" >/dev/null && break
  sleep 0.25
done

"$CHROME" --headless --disable-gpu --no-sandbox \
  --run-all-compositor-stages-before-draw --virtual-time-budget=20000 \
  --print-to-pdf-no-header --print-to-pdf="$OUT" \
  "http://localhost:$PORT/docs/deck/소개서.html" 2>/dev/null || true

if [ -f "$OUT" ]; then
  echo "완료: $OUT ($(du -h "$OUT" | cut -f1))"
  echo "미리보기: http://localhost:$PORT/docs/deck/소개서.html  (서버는 종료됩니다)"
else
  echo "실패: PDF가 만들어지지 않았습니다" >&2
  exit 1
fi

# 메일 첨부·링크가 public/ 에서 읽는다 — 빌드할 때마다 같이 갱신한다
cp "$OUT" "$PUB"
echo "배포본: $PUB"
