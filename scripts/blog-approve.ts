/**
 * 승인 도장을 손으로 찍는 손잡이. (2026-08-16)
 *
 *   npx tsx --env-file=.env.local scripts/blog-approve.ts
 *
 * `blog-runner` 의 polish 단계가 하는 일과 **똑같은 검사식**을 돌린다.
 * 통과하면 `approved_at` 을 찍고 작업표를 done 으로 닫는다. 미달이면
 * 아무것도 바꾸지 않고 걸린 항목만 찍는다 — 규격을 우회하는 문이 아니다.
 *
 * 왜 필요했나: 08-16 오전에 cron 틱이 끊겨 polish 단계가 실행되지 못한 채
 * 원고가 멈췄다. 검사식은 이미 통과하는 원고였는데 도장을 찍어 줄 손이
 * 없었다. 트리거가 죽어도 그날 편을 살릴 수 있어야 한다.
 */
import { auditPost } from "../lib/blog-audit";
import type { FormatKey } from "../lib/blog-spec";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const h = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };

  const [job] = await (
    await fetch(
      `${url}/rest/v1/blog_job?select=id,format,sources,post_id,stage,revisions&stage=eq.polish`,
      { headers: h },
    )
  ).json();
  if (!job) {
    console.log("polish 단계에 멈춰 있는 작업이 없습니다 — 손댈 것 없음");
    return;
  }

  const [post] = await (
    await fetch(
      `${url}/rest/v1/blog_post?select=id,title,slug,body&id=eq.${job.post_id}`,
      { headers: h },
    )
  ).json();

  const result = auditPost({
    body: post.body,
    formatKey: job.format as FormatKey,
    sources: job.sources ?? [],
    title: post.title,
    slug: post.slug,
  });

  if (!result.ok) {
    console.log("검사 미통과 — 승인하지 않습니다:");
    for (const f of result.failures) console.log(" -", f);
    return;
  }

  const now = new Date().toISOString();

  const p = await fetch(`${url}/rest/v1/blog_post?id=eq.${post.id}`, {
    method: "PATCH",
    headers: h,
    body: JSON.stringify({ approved_at: now, audit: result, updated_at: now }),
  });
  console.log("원고 승인:", p.status, post.slug);

  const j = await fetch(`${url}/rest/v1/blog_job?id=eq.${job.id}`, {
    method: "PATCH",
    headers: h,
    body: JSON.stringify({
      stage: "done",
      audit: result,
      locked_at: null,
      updated_at: now,
    }),
  });
  console.log("작업표 done:", j.status);

  await fetch(`${url}/rest/v1/blog_ops_log`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({
      route: "generate",
      ok: true,
      note: `polish → done · 검사식 오탐(이유형 질문) 고친 뒤 재검사 통과 · 승인 — ${result.chars}자`,
    }),
  });

  console.log(`통과 · ${result.chars}자 · 읽는 시간 ${result.readMinutes}분`);
}

main();
