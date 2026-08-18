/**
 * 실패로 닫힌 작업표를 다시 열어 주는 손잡이. (2026-08-18)
 *
 *   npx tsx --env-file=.env.local scripts/blog-retry.ts            # 실패한 날 목록만 보여 준다
 *   npx tsx --env-file=.env.local scripts/blog-retry.ts 2026-08-17 # 그날 것을 다시 연다
 *   npx tsx --env-file=.env.local scripts/blog-retry.ts --all      # 실패한 날을 전부 다시 연다
 *
 * 왜 필요했나: 08-17·08-18 두 편이 OpenAI 크레딧 소진(429 credit_balance_exhausted)
 * 으로 조사 단계에서 죽었다. `claim()` 은 stage 가 failed 인 줄을 영영 건너뛰므로
 * 크레딧을 채워 넣어도 그 두 날은 저절로 되살아나지 않는다. attempts 를 0 으로
 * 되돌리고 stage 를 research 로 돌려 놔야 다음 틱이 집어 간다.
 *
 * 실패 원인을 고치지 않은 채 열면 같은 자리에서 또 죽는다. 열기 전에
 * `blog-doctor.ts` 로 원인이 사라졌는지 먼저 확인할 것.
 */
type Job = {
  id: string;
  scheduled_for: string;
  stage: string;
  attempts: number;
  topic: string;
  last_error: string | null;
};

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const h = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };

  const arg = process.argv[2];

  const failed: Job[] = await (
    await fetch(
      `${url}/rest/v1/blog_job?select=id,scheduled_for,stage,attempts,topic,last_error` +
        `&stage=eq.failed&order=scheduled_for.desc&limit=20`,
      { headers: h },
    )
  ).json();

  if (!failed.length) {
    console.log("failed 로 닫힌 작업표가 없습니다 — 손댈 것 없음");
    return;
  }

  if (!arg) {
    console.log("실패로 닫힌 작업표:");
    for (const j of failed) {
      console.log(
        `  ${j.scheduled_for}  시도 ${j.attempts}회  ${j.topic.slice(0, 40)}…`,
      );
      console.log(`      ${(j.last_error ?? "").split("\n")[0].slice(0, 110)}`);
    }
    console.log(
      "\n다시 열려면 날짜를 붙여서 부르세요. 예) scripts/blog-retry.ts " +
        failed[0].scheduled_for,
    );
    return;
  }

  const targets =
    arg === "--all" ? failed : failed.filter((j) => j.scheduled_for === arg);

  if (!targets.length) {
    console.log(`${arg} 에 failed 인 작업표가 없습니다`);
    return;
  }

  for (const j of targets) {
    const r = await fetch(`${url}/rest/v1/blog_job?id=eq.${j.id}`, {
      method: "PATCH",
      headers: h,
      body: JSON.stringify({
        stage: "research",
        attempts: 0,
        locked_at: null,
        last_error: null,
      }),
    });
    if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
    console.log(`↺ ${j.scheduled_for} → research 로 되돌렸습니다`);
  }

  console.log(
    "\n다음 틱(5분 간격)이 집어 갑니다. 바로 밀려면:\n" +
      `  curl -H "Authorization: Bearer $CRON_SECRET" "https://hgrs.io/api/blog/generate?force=1"`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

// 이 파일은 스크립트다. 전역 스코프 충돌을 막으려고 모듈로 못 박는다
export {};
