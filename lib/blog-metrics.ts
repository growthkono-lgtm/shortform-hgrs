import "server-only";

import { kstDate } from "@/lib/blog-schedule";
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
