/**
 * 블로그 자동화 종합 점검. (2026-08-16)
 *
 *   npx tsx --env-file=.env.local scripts/blog-doctor.ts
 *
 * `docs/BLOG_CHECKLIST.md` 의 항목을 **실제로 돌려서** 확인한다. 문서는 사람이
 * 읽는 것이고 이건 기계가 세는 것이다. 둘이 어긋나면 이쪽이 맞다.
 *
 * ── 왜 만들었나 ────────────────────────────────────────────────────────
 * 08-16 에 멀쩡한 자동화를 "죽었다" 고 오진했다. 근거로 삼은 것이 문서였고,
 * 그 문서는 두 번의 개편을 안 따라온 상태였다. 판단에 쓸 것은 문서가 아니라
 * 살아 있는 값이어야 한다. 그래서 판단 근거를 전부 여기 모았다.
 *
 * 종료 코드: 0 = 전부 정상 / 1 = 하나라도 ❌
 */
import { auditPost } from "../lib/blog-audit";
import { FORMATS, type FormatKey } from "../lib/blog-spec";
import { isDomestic, isVisual, type Source } from "../lib/blog-sources";
import { TOPIC_QUEUE } from "../lib/blog-schedule";
import { queueBlockReasons } from "../lib/keyword-filter";

type Check = {
  구분: string;
  항목: string;
  결과: string;
  판정: "✅" | "⚠️" | "❌";
};

const checks: Check[] = [];
const add = (구분: string, 항목: string, 판정: Check["판정"], 결과: string) =>
  checks.push({ 구분, 항목, 결과, 판정 });

const REST = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY!, Authorization: `Bearer ${KEY}` };

const rest = async (path: string) => {
  const r = await fetch(`${REST}/rest/v1/${path}`, { headers: H });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.json();
};

const sql = async (query: string) => {
  const r = await fetch(
    `https://api.supabase.com/v1/projects/${process.env.SUPABASE_PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    },
  );
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.json();
};

const kstDay = (d = new Date()) => {
  const s = new Date(d.getTime() + 9 * 3600 * 1000);
  return s.toISOString().slice(0, 10);
};

async function main() {
  /* ── 1. 방아쇠 ──────────────────────────────────────────────────── */
  try {
    const jobs = await sql(
      "select jobname, schedule, active from cron.job order by jobname",
    );
    const blog = jobs.filter((j: { jobname: string }) =>
      j.jobname.startsWith("blog-"),
    );
    const dead = blog.filter((j: { active: boolean }) => !j.active);
    add(
      "방아쇠",
      "Supabase pg_cron 예약",
      blog.length >= 5 && dead.length === 0 ? "✅" : "❌",
      `${blog.length}개 등록 · 비활성 ${dead.length}개`,
    );

    const runs = await sql(
      "select count(*) as n from cron.job_run_details where start_time > now() - interval '24 hours' and status = 'succeeded'",
    );
    const failed = await sql(
      "select count(*) as n from cron.job_run_details where start_time > now() - interval '24 hours' and status <> 'succeeded'",
    );
    add(
      "방아쇠",
      "지난 24시간 발사",
      Number(runs[0].n) > 0 && Number(failed[0].n) === 0 ? "✅" : "⚠️",
      `성공 ${runs[0].n}회 · 실패 ${failed[0].n}회`,
    );
  } catch (e) {
    add("방아쇠", "pg_cron 조회", "❌", String(e).slice(0, 80));
  }

  /* ── 2. 오늘 회차 ───────────────────────────────────────────────── */
  const today = kstDay();
  const [job] = await rest(
    `blog_job?select=scheduled_for,stage,revisions,cost_usd,last_error,post_id&scheduled_for=eq.${today}`,
  );
  if (!job) {
    add("오늘", "작업표", "⚠️", `${today} 작업이 아직 없습니다 (09시 생성)`);
  } else {
    add(
      "오늘",
      "진행 단계",
      job.stage === "done" ? "✅" : job.stage === "failed" ? "❌" : "⚠️",
      `${job.stage} · 교정 ${job.revisions ?? 0}회 · $${Number(job.cost_usd ?? 0).toFixed(2)}`,
    );
    if (job.last_error) add("오늘", "마지막 오류", "⚠️", String(job.last_error).slice(0, 70));
  }

  /* ── 3. 원고 규격 ───────────────────────────────────────────────── */
  const [post] = await rest(
    "blog_post?select=slug,title,body,format,sources,status,approved_at,published_at,scheduled_for&kind=eq.insight&order=created_at.desc&limit=1",
  );
  if (post) {
    const f = FORMATS.find((x) => x.key === post.format)!;
    const sources = (post.sources ?? []) as Source[];
    const result = auditPost({
      body: post.body,
      formatKey: post.format as FormatKey,
      sources,
      title: post.title,
      slug: post.slug,
    });
    add(
      "원고",
      `최신편 규격 (${post.slug.slice(0, 28)})`,
      result.ok ? "✅" : "❌",
      result.ok
        ? `${result.chars}자 · ${f.label}`
        : result.failures.slice(0, 2).join(" / "),
    );

    const cited = new Set(
      [...post.body.matchAll(/:::source\s+(\d+)/g)].map((m: RegExpMatchArray) =>
        Number(m[1]),
      ),
    );
    const used = sources.filter((_, i) => cited.has(i + 1));
    const dom = used.filter(isDomestic).length;
    add(
      "원고",
      "국내 자료 비율",
      used.length === 0 ? "❌" : dom / used.length >= 0.7 ? "✅" : "❌",
      `${dom}/${used.length}건`,
    );
    const playing = used.filter(isVisual);
    add(
      "원고",
      "본문에서 재생되는 자료",
      playing.length >= f.minEmbeds && playing.every(isDomestic) ? "✅" : "❌",
      `${playing.length}건 (기준 ${f.minEmbeds}) · 해외 ${playing.filter((s) => !isDomestic(s)).length}건`,
    );
    add(
      "원고",
      "승인 도장",
      post.approved_at || post.published_at ? "✅" : "⚠️",
      post.published_at ? "발행됨" : post.approved_at ? "승인 · 발행 대기" : "미승인",
    );
  }

  /* ── 4. 성과 기록 ───────────────────────────────────────────────── */
  try {
    const snaps = await rest(
      "blog_search_daily?select=captured_on,impressions,clicks,position&dimension=eq.total&order=captured_on.desc&limit=7",
    );
    add(
      "성과",
      "검색 성과 일별 기록",
      snaps.length > 0 ? "✅" : "⚠️",
      snaps.length
        ? `${snaps.length}일치 · 최근 ${snaps[0].captured_on} 노출 ${snaps[0].impressions}`
        : "아직 없음 (18시 리포트가 첫 줄을 적습니다)",
    );
  } catch {
    add("성과", "검색 성과 표", "❌", "blog_search_daily 조회 실패");
  }

  const views = await rest("blog_view?select=views");
  add(
    "성과",
    "조회수 집계",
    "✅",
    `누적 ${(views as { views: number }[]).reduce((s, v) => s + v.views, 0)}회`,
  );

  const kwCount = await fetch(
    `${REST}/rest/v1/blog_keyword?select=id&status=eq.idle`,
    { headers: { ...H, Prefer: "count=exact", Range: "0-0" } },
  );
  const total = kwCount.headers.get("content-range")?.split("/")[1] ?? "0";
  add(
    "성과",
    "남은 키워드",
    Number(total) > 30 ? "✅" : "⚠️",
    `${total}개 (하루 1편 기준 ${Math.floor(Number(total))}일치)`,
  );

  /* ── 4-2. 편성 큐 검증 (2026-08-19 신설) ────────────────────────
   *
   * 사장님 스크린샷으로 발견한 두 사고를 여기서 기계가 잡게 한다.
   *  · 이미 쓴 큐 항목이 미래 슬롯에 유령으로 뜨던 것
   *  · 큐가 관련성·하한 규칙을 한 번도 안 통과한 채 편성되던 것
   *    (오늘 편이 `스마트스토어상품등록대행`(510)으로 나간 경로)
   *
   * 판정은 화면·편성과 **같은 함수**(`queueBlockReasons`)를 쓴다.
   * 두 벌로 두면 또 어긋난다 — 오늘 하루에 세 번 그랬다.
   */
  const queueTerms = TOPIC_QUEUE.map((t) => t.term);
  const queueRows = (await rest(
    `blog_keyword?select=term,total_volume,status&term=in.(${queueTerms.map(encodeURIComponent).join(",")})`,
  )) as { term: string; total_volume: number | null; status: string }[];
  const queueByTerm = new Map(queueRows.map((r) => [r.term, r]));
  const allJobs = (await rest(`blog_job?select=keyword_term`)) as {
    keyword_term: string | null;
  }[];
  const takenTerms = new Set(
    allJobs.map((j) => j.keyword_term).filter(Boolean) as string[],
  );

  const queueUsable = TOPIC_QUEUE.filter(
    (t) =>
      queueBlockReasons({
        term: t.term,
        volume: queueByTerm.get(t.term)?.total_volume ?? null,
        status: queueByTerm.get(t.term)?.status ?? null,
        taken: takenTerms.has(t.term),
      }).length === 0,
  );
  add(
    "편성",
    "손큐 잔량",
    queueUsable.length >= 7 ? "✅" : queueUsable.length > 0 ? "⚠️" : "❌",
    `${queueUsable.length}/${TOPIC_QUEUE.length}개 사용 가능 (부적격 ${TOPIC_QUEUE.length - queueUsable.length})`,
  );

  /* ── 5. 돈 ─────────────────────────────────────────────────────── */
  const month = today.slice(0, 7);
  const monthJobs = await rest(
    `blog_job?select=cost_usd&scheduled_for=gte.${month}-01`,
  );
  const spent = (monthJobs as { cost_usd: number }[]).reduce(
    (s, j) => s + Number(j.cost_usd ?? 0),
    0,
  );
  add(
    "돈",
    "이번 달 생성비",
    spent < 80 * 0.8 ? "✅" : "⚠️",
    `$${spent.toFixed(2)} / 상한 $80`,
  );

  /* ── 6. 라이브 ─────────────────────────────────────────────────── */
  for (const [label, url] of [
    ["블로그 목록", "https://hgrs.io/blog"],
    ["사이트맵", "https://hgrs.io/sitemap.xml"],
  ] as const) {
    const r = await fetch(url);
    add("라이브", label, r.ok ? "✅" : "❌", `HTTP ${r.status}`);
  }

  console.table(checks);
  const bad = checks.filter((c) => c.판정 === "❌");
  const warn = checks.filter((c) => c.판정 === "⚠️");
  console.log(
    `\n${bad.length === 0 ? "✅ 막힌 곳 없음" : `❌ ${bad.length}건 조치 필요`}` +
      (warn.length ? ` · ⚠️ 지켜볼 것 ${warn.length}건` : ""),
  );
  if (bad.length) process.exitCode = 1;
}

main();
