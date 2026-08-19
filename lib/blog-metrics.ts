import "server-only";

import { kstAddDays, kstDate, kstParts } from "@/lib/blog-schedule";
import { pagePerformance } from "@/lib/search-console";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * 콘텐츠별 성적 측정 — 발행 후 세 시점에만. (2026-08-18)
 *
 * 사장님 제안: *"업로드로부터 D+ 지난 시점 기준으로 측정한 값을 올리고,
 * 콘텐츠별로 3번만 업데이트하는 걸로."*
 *
 * 매일 재면 표가 지저분해지고 판단이 안 된다. 세 번이면 곡선이 그려진다.
 * 간격을 D+5·10·15 에서 늘린 이유는 `blog_post_metric` 마이그레이션 머리말에
 * 적어 뒀다 — 요약하면 니치가 붙는 데 2~8주라 15일차 0 은 실패가 아니다.
 */
export const CHECKPOINTS = [7, 21, 60] as const;
export type Checkpoint = (typeof CHECKPOINTS)[number];

export const CHECKPOINT_MEANING: Record<Checkpoint, string> = {
  7: "색인됐나",
  21: "순위가 붙기 시작하나",
  60: "최종 성적",
};

type DueRow = { id: string; slug: string; published_at: string };

/** KST 자정 기준으로 며칠 지났나 */
function daysSince(publishedAt: string, now: Date): number {
  const a = new Date(`${kstDate(new Date(publishedAt))}T00:00:00+09:00`);
  const b = new Date(`${kstDate(now)}T00:00:00+09:00`);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

export type MetricRunResult = { measured: number; note: string };

/**
 * 오늘 잴 차례인 글을 재서 적는다. 하루 한 번 리포트 크론이 부른다.
 *
 * 크론이 하루 밀려도 놓치지 않는다 — "정확히 D+7 인 글" 이 아니라
 * **"D+7 을 지났는데 아직 안 잰 글"** 을 찾는다. 놓친 측정은 영영 못 되살린다.
 */
export async function recordDueMetrics(now = new Date()): Promise<MetricRunResult> {
  const supabase = createAdminClient();

  const { data: posts } = await supabase
    .from("blog_post")
    .select("id, slug, published_at")
    .eq("status", "published")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(200);

  const rows = (posts ?? []) as DueRow[];
  if (!rows.length) return { measured: 0, note: "발행된 글이 없습니다" };

  const { data: done } = await supabase
    .from("blog_post_metric")
    .select("post_id, offset_days");
  const already = new Set(
    ((done ?? []) as { post_id: string; offset_days: number }[]).map(
      (d) => `${d.post_id}|${d.offset_days}`,
    ),
  );

  /* 잴 차례가 된 (글, 시점) 짝을 모은다 */
  const due: { post: DueRow; offset: Checkpoint }[] = [];
  for (const post of rows) {
    const age = daysSince(post.published_at, now);
    for (const offset of CHECKPOINTS) {
      if (age >= offset && !already.has(`${post.id}|${offset}`)) {
        due.push({ post, offset });
      }
    }
  }
  if (!due.length) return { measured: 0, note: "오늘 잴 차례인 글이 없습니다" };

  /**
   * 같은 글의 서로 다른 시점은 **측정 구간이 같다** — 둘 다 발행일부터
   * 오늘까지 누적이다. 그러니 글당 한 번만 물으면 된다. GSC 호출을 아낀다.
   */
  const uniquePosts = [...new Map(due.map((d) => [d.post.id, d.post])).values()];
  const oldest = uniquePosts.reduce(
    (min, p) => (new Date(p.published_at) < min ? new Date(p.published_at) : min),
    new Date(uniquePosts[0].published_at),
  );

  const perf = await pagePerformance(
    uniquePosts.map((p) => `/blog/${p.slug}`),
    oldest,
    now,
  );
  if (!perf.size) return { measured: 0, note: "Search Console 에서 값을 못 받았습니다" };

  const captured_on = kstDate(now);
  const payload = due
    .map(({ post, offset }) => {
      const p = perf.get(`/blog/${post.slug}`);
      if (!p) return null;
      return {
        post_id: post.id,
        offset_days: offset,
        captured_on,
        impressions: p.impressions,
        clicks: p.clicks,
        position: p.position,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (!payload.length) return { measured: 0, note: "잴 차례인 글의 값을 못 받았습니다" };

  await supabase
    .from("blog_post_metric")
    .upsert(payload, { onConflict: "post_id,offset_days" });

  return {
    measured: payload.length,
    note: due
      .map(({ post, offset }) => `${post.slug} D+${offset}`)
      .slice(0, 5)
      .join(", "),
  };
}

export type PostMetric = {
  offsetDays: number;
  capturedOn: string;
  impressions: number;
  clicks: number;
  position: number | null;
};

/** 글별 성적 — 편성표가 읽는다. 가장 나중 시점 것이 대표값이다 */
export async function metricsByPost(): Promise<Map<string, PostMetric[]>> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("blog_post_metric")
    .select("post_id, offset_days, captured_on, impressions, clicks, position")
    .order("offset_days", { ascending: true });

  const out = new Map<string, PostMetric[]>();
  for (const r of (data ?? []) as {
    post_id: string;
    offset_days: number;
    captured_on: string;
    impressions: number;
    clicks: number;
    position: number | null;
  }[]) {
    const list = out.get(r.post_id) ?? [];
    list.push({
      offsetDays: r.offset_days,
      capturedOn: r.captured_on,
      impressions: r.impressions,
      clicks: r.clicks,
      position: r.position === null ? null : Number(r.position),
    });
    out.set(r.post_id, list);
  }
  return out;
}

/* ─────────────────────────────────────────────────────────────
 * 주간 깔때기 — 노출 → 클릭 → 조회 → 전환. (2026-08-19)
 *
 * 사장님 지시: *"컨텐츠를 통한 타겟 상위노출과 도달유입 > 전환성공의 각
 * 모수와 전환율, 그리고 노출순위를 보는 게 중요하다. 7일 단위로 업데이트가
 * 되어서 해당 블로그 컨텐츠 유입량과 전환 건이 달라지는 게 맞을 듯하다."*
 *
 * 위의 `recordDueMetrics` 는 D+7·21·60 **세 번만** 재는 고정 검침이라
 * "이번 주에 얼마나 들어와 몇 건이 됐나" 를 못 답한다. 고정 검침은 글의
 * 성장 곡선을 보는 것이고, 이 주간 집계는 **지금 장사가 되고 있나**를 본다.
 * 목적이 다르니 표도 따로 둔다.
 *
 * 네 단을 굳이 나눠 두는 이유 —
 *   노출→클릭  검색 결과에서 우리 제목이 먹히나 (CTR)
 *   클릭→조회  검색 말고 다른 경로로도 들어오나 (조회가 클릭보다 크면 그렇다)
 *   조회→전환  글이 사람을 움직였나
 * 하나로 뭉치면 어디가 막혔는지 영영 알 수 없다.
 * ───────────────────────────────────────────────────────────── */

/** 그 주의 월요일 (KST). 주의 경계는 한국 달력으로 긋는다 */
export function weekStart(at: Date): string {
  const { weekday } = kstParts(at);
  // getUTCDay 기준 0=일요일. 월요일을 시작으로 삼으니 일요일은 6일 전이다
  const back = weekday === 0 ? 6 : weekday - 1;
  return kstDate(kstAddDays(at, -back));
}

export type WeekFunnel = {
  weekStart: string;
  impressions: number;
  clicks: number;
  position: number | null;
  views: number;
  inquiries: number;
};

export type WeeklyRunResult = { rows: number; note: string };

/**
 * 이번 주 성적을 다시 계산해 덮어쓴다. 리포트 크론이 매일 부른다.
 *
 * **매일 덮어쓰는 게 맞다.** 주가 끝나기 전에도 "이번 주 지금까지" 를 봐야
 * 하고, Search Console 은 2~3일 늦게 들어와서 주가 끝난 뒤에도 값이 채워진다.
 * 지난 주 행도 함께 다시 재는 이유가 그것이다 — 월요일에 확정된 것처럼
 * 굳혀 두면 뒤늦게 들어온 노출이 영영 빠진다.
 */
export async function recordWeekly(
  now = new Date(),
  /** 마지막 갱신이 얼마 전이든 지금 다시 잰다 (`?force=1`) */
  force = false,
): Promise<WeeklyRunResult> {
  const supabase = createAdminClient();

  /**
   * 리포트 라우트는 5분마다 불린다. 매번 Search Console 을 두드리면 하루
   * 576회고, 그렇게 자주 물어도 값은 안 바뀐다(GSC 자체가 2~3일 지연이다).
   * 마지막으로 적은 지 6시간이 안 됐으면 그냥 돌아간다.
   */
  if (!force) {
    const { data: last } = await supabase
      .from("blog_post_week")
      .select("captured_at")
      .order("captured_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const at = last?.captured_at ? new Date(last.captured_at).getTime() : 0;
    if (now.getTime() - at < 6 * 3_600_000) {
      return { rows: 0, note: "최근 6시간 안에 이미 갱신됨" };
    }
  }

  const { data: posts } = await supabase
    .from("blog_post")
    .select("id, slug, published_at")
    .eq("status", "published")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(300);

  const all = (posts ?? []) as DueRow[];
  if (!all.length) return { rows: 0, note: "발행된 글이 없습니다" };

  /* 이번 주와 지난 주, 두 주를 다시 잰다 */
  const weeks = [weekStart(now), weekStart(kstAddDays(now, -7))];
  let written = 0;

  for (const start of weeks) {
    const from = new Date(`${start}T00:00:00+09:00`);
    const to = new Date(`${kstDate(kstAddDays(from, 6))}T23:59:59+09:00`);
    if (from.getTime() > now.getTime()) continue;

    /**
     * 그 주에 이미 나와 있던 글만 센다. 발행 전 주에 0 을 적으면
     * "성과 없음" 처럼 읽히는데, 실은 아직 존재하지도 않았다.
     */
    const live = all.filter((p) => new Date(p.published_at).getTime() <= to.getTime());
    if (!live.length) continue;

    const perf = await pagePerformance(
      live.map((p) => `/blog/${p.slug}`),
      from,
      now,
      to,
    );

    /* 조회수 — 우리 실측(blog_view). 검색 밖에서 들어온 사람이 여기 잡힌다 */
    const { data: viewRows } = await supabase
      .from("blog_view")
      .select("slug, views")
      .gte("day", start)
      .lte("day", kstDate(kstAddDays(from, 6)));
    const views = new Map<string, number>();
    for (const v of viewRows ?? []) {
      views.set(v.slug, (views.get(v.slug) ?? 0) + v.views);
    }

    /**
     * 전환 — 그 주에 접수됐고, **그 글로 처음 들어온** 신청.
     *
     * 어시스트(다른 곳으로 들어왔지만 그 글도 읽은 경우)는 여기 세지 않는다.
     * 한 건이 여러 글에 중복으로 잡히면 전환율 합이 100% 를 넘는다.
     * 어시스트는 신청 상세에서 따로 보여 준다.
     *
     * 마이그레이션 적용 전에는 이 컬럼이 없어 에러가 난다 — 그때는 0 이다.
     */
    const converted = new Map<string, number>();
    const { data: leads } = await supabase
      .from("inquiries")
      .select("entry_post_id")
      .not("entry_post_id", "is", null)
      .gte("created_at", from.toISOString())
      .lte("created_at", to.toISOString());
    for (const l of leads ?? []) {
      const id = l.entry_post_id as string | null;
      if (id) converted.set(id, (converted.get(id) ?? 0) + 1);
    }

    const payload = live
      .map((p) => {
        const g = perf.get(`/blog/${p.slug}`);
        const row = {
          post_id: p.id,
          week_start: start,
          impressions: g?.impressions ?? 0,
          clicks: g?.clicks ?? 0,
          position: g?.position ?? null,
          views: views.get(p.slug) ?? 0,
          inquiries: converted.get(p.id) ?? 0,
          captured_at: now.toISOString(),
        };
        /**
         * 오래된 글은 값이 있을 때만 적는다. 3년 뒤에도 매주 전편에 0 을
         * 적으면 표가 0 으로 뒤덮인다. 대신 **최근 90일 글은 0 도 적는다** —
         * 갓 나온 글의 0 은 "아직 색인 전" 이라는 정보다.
         */
        const fresh =
          now.getTime() - new Date(p.published_at).getTime() < 90 * 86_400_000;
        const any = row.impressions || row.clicks || row.views || row.inquiries;
        return fresh || any ? row : null;
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    if (!payload.length) continue;

    const { error } = await supabase
      .from("blog_post_week")
      .upsert(payload, { onConflict: "post_id,week_start" });
    if (error) return { rows: written, note: `주간 집계 실패 — ${error.message}` };
    written += payload.length;
  }

  return {
    rows: written,
    note: written ? `${weeks[0]} 주 포함 ${written}줄 갱신` : "적을 줄이 없습니다",
  };
}

/** 글별 주간 성적 — 최근 주가 앞이다. 편성표가 읽는다 */
export async function weeklyByPost(weeks = 8): Promise<Map<string, WeekFunnel[]>> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("blog_post_week")
    .select("post_id, week_start, impressions, clicks, position, views, inquiries")
    .order("week_start", { ascending: false })
    .limit(weeks * 400);

  const out = new Map<string, WeekFunnel[]>();
  for (const r of (data ?? []) as {
    post_id: string;
    week_start: string;
    impressions: number;
    clicks: number;
    position: number | null;
    views: number;
    inquiries: number;
  }[]) {
    const list = out.get(r.post_id) ?? [];
    list.push({
      weekStart: r.week_start,
      impressions: r.impressions,
      clicks: r.clicks,
      position: r.position === null ? null : Number(r.position),
      views: r.views,
      inquiries: r.inquiries,
    });
    out.set(r.post_id, list);
  }
  return out;
}
