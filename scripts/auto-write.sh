#!/bin/zsh
#
# 월·수·목 오전 11시에 맥에서 스스로 뜨는 원고 작성기. (2026-08-14)
#
# 앤트로픽 API 를 쓰지 않는다 — Claude Code 를 헤드리스(-p)로 띄워
# **사장님 구독 안에서** 돌린다. 그래서 앤트로픽 청구서는 0원이다.
# 대신 이 시각에 맥이 켜져 있어야 한다(11시 알림 메일이 그 안내다).
#
# 왜 --dangerously-skip-permissions 를 안 쓰는가:
# 그건 무엇이든 무사통과다. 원고 쓰는 데 필요한 도구만 열어 둔다 —
# 검색·읽기·초안 파일 쓰기·어드민 등록(curl). 그 밖의 것은 아예 못 한다.
#
# 로그: ~/Library/Logs/hgrs-blog-auto.log
set -uo pipefail

REPO="/Users/gunho/Documents/hgrs-boost"
CLAUDE="/Users/gunho/.local/bin/claude"
LOG="$HOME/Library/Logs/hgrs-blog-auto.log"

say() { print -r -- "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG" }

say "─────────── 시작 ───────────"

# 오늘이 편성일(월1·수3·목4)이 아니면 아무것도 하지 않는다.
# launchd 에도 요일을 걸어 두지만, 수동 실행까지 막으려면 여기서도 본다
DOW=$(date +%u)   # 1=월 … 7=일
if [[ "$DOW" != "1" && "$DOW" != "3" && "$DOW" != "4" ]]; then
  say "편성일이 아닙니다 (요일 $DOW). 종료."
  exit 0
fi

if [[ ! -x "$CLAUDE" ]]; then
  say "claude 실행 파일을 못 찾았습니다: $CLAUDE"
  exit 1
fi

# ⚠️ 이 변수가 살아 있으면 Claude Code 가 구독 대신 API 키를 쓸 수 있다.
# 그러면 크레딧이 나간다 — 이 스크립트의 존재 이유가 무너진다
unset ANTHROPIC_API_KEY

cd "$REPO" || { say "레포를 못 찾았습니다: $REPO"; exit 1 }

say "원고 작성 시작"

"$CLAUDE" -p "$(cat "$REPO/scripts/auto-write.prompt.md")" \
  --allowed-tools "WebSearch" "WebFetch" "Read" "Write" "Edit" "Glob" "Grep" "Bash(curl:*)" "Bash(npx tsx scripts/blog-audit.ts:*)" \
  >> "$LOG" 2>&1

CODE=$?
say "종료 코드 $CODE"
say "─────────── 끝 ───────────"
exit $CODE
