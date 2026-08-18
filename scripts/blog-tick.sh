#!/bin/zsh
#
# 블로그 자동 운영 틱 — 5분마다 맥에서 스스로 뜬다. (2026-08-14)
#
# 사장님 지시: "크론 필요없어 그럼. 어차피 너가 알아서 매일 돌릴거잖아."
# cron-job.org 에 스위치를 등록하지 않기로 했으므로, 그 역할을 이 스크립트가
# 대신한다. 하는 일은 cron-job.org 가 하던 것과 **똑같다** — 우리 서버의
# 입구를 두드리기만 한다. 원고를 만드는 건 서버(OpenAI)다.
#
#   /api/blog/generate  한 단계씩 (조사→기획→검증→집필→교정)
#   /api/blog/publish   17시가 지난 승인 원고를 내보낸다
#   /api/blog/announce  구독자 알림
#   /api/blog/report    18시 리포트 한 통
#
# ⚠️ 맥이 꺼져 있으면 안 돈다. 다만 launchd 는 깨어난 직후 밀린 실행을 한 번
# 처리하므로, 하루 종일 꺼져 있지만 않으면 그날 몫은 따라잡는다.
#
# 로그: ~/Library/Logs/hgrs-blog-tick.log (최근 것만 남긴다)
set -uo pipefail

# launchd 는 PATH 를 거의 안 물려준다. 실행 파일은 절대 경로로 부른다
export PATH="/usr/bin:/bin:/usr/sbin:/sbin"

REPO="/Users/gunho/Documents/hgrs-boost"
LOG="$HOME/Library/Logs/hgrs-blog-tick.log"

SECRET=$(/usr/bin/grep '^CRON_SECRET=' "$REPO/.env.local" | /usr/bin/cut -d= -f2- | /usr/bin/tr -d '"'"'"'')
if [[ -z "$SECRET" ]]; then
  printf "%s\n" "[$(/bin/date '+%F %T')] CRON_SECRET 을 못 읽었습니다" >> "$LOG"
  exit 1
fi

hit() {
  local path="$1"
  local body
  body=$(/usr/bin/curl -sS --max-time 300 -H "Authorization: Bearer $SECRET" \
    "https://hgrs.io/api/blog/$path" 2>&1)
  # 할 일이 없을 때가 대부분이라 그건 안 적는다. 로그가 하루 만에 못 읽게 된다
  if [[ "$body" != *'"skipped"'* && "$body" != *'"할 일 없음"'* && "$body" != *'"published":[],"waiting":0'* ]]; then
    printf "%s\n" "[$(/bin/date '+%F %T')] $path → $body" >> "$LOG"
  fi
}

hit generate
hit publish
hit announce
hit report

# 로그가 무한정 자라지 않게 최근 500줄만 남긴다
if [[ -f "$LOG" ]]; then
  /usr/bin/tail -n 500 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
fi
