import "server-only";

import { PUBLISH_HOUR, PUBLISH_MINUTE, kstMoment } from "@/lib/blog-schedule";
import { pingIndexNow } from "@/lib/indexnow";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * 승인된 글을 예약 시각에 내보내는 한 곳. (2026-08-13)
 *
 * 어드민의 "지금 바로 내보내기" 와 cron 이 같은 함수를 부른다. 발행 경로가
 * 둘로 갈리면 번호 붙이는 규칙이 서로 어긋나고, 어느 쪽으로 나갔느냐에 따라
 * 결과가 달라진다.
 */

/**
 * 예약 발행 시각 — 예정일 저녁 5시 **한국 시각**.
 *
 * `setHours(17)` 를 쓰지 않는다. 배포된 서버는 UTC 로 돌아서 그렇게 쓰면
 * 17:00 UTC = 새벽 2시(KST) 가 된다.
 */
export function publishMomentOf(scheduledFor: string): Date {
  return kstMoment(new Date(scheduledFor), PUBLISH_HOUR, PUBLISH_MINUTE);
}

/**
 * 다음 회차 번호. 인사이트에만 붙는다.
 *
 * 왜 매번 세지 않고 최댓값 + 1 인가: 번호는 한 번 붙으면 안 변해야 한다.
 * 개수로 계산하면 중간 글을 내렸을 때 뒷 글 번호가 밀리고, 이미 그 번호로
 * 공유된 링크와 어긋난다.
 */
async function nextSeq(): Promise<number> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("blog_post")
    .select("seq")
    .not("seq", "is", null)
    .order("seq", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.seq ?? 0) + 1;
}

export type PublishResult = {
  published: { id: string; slug: string; seq: number | null }[];
  waiting: number;
};

/**
 * 지금 내보낼 수 있는 글을 전부 내보낸다.
 *
 * 조건 셋을 모두 만족해야 한다 —
 *  1. 사장님이 승인했다(`approved_at`)
 *  2. 아직 안 나갔다(`published_at is null`)
 *  3. 예정일 17시가 지났다
 *
 * 승인하지 않은 글은 예정일이 아무리 지나도 나가지 않는다.
 */
export async function publishDue(now = new Date()): Promise<PublishResult> {
  const supabase = createAdminClient();

  const { data: rows } = await supabase
    .from("blog_post")
    .select("id, slug, kind, scheduled_for, seq, keyword_id")
    .not("approved_at", "is", null)
    .is("published_at", null)
    .order("scheduled_for", { ascending: true })
    .limit(10);

  const published: PublishResult["published"] = [];
  let waiting = 0;

  for (const row of rows ?? []) {
    // 예정일이 없는 글은 승인 즉시 나간다 — 편성표 밖에서 급히 올리는 경우다
    const due = row.scheduled_for ? publishMomentOf(row.scheduled_for) : now;
    if (due.getTime() > now.getTime()) {
      waiting += 1;
      continue;
    }

    const seq = row.seq ?? (row.kind === "story" ? null : await nextSeq());
    const { error } = await supabase
      .from("blog_post")
      .update({
        status: "published",
        published_at: now.toISOString(),
        seq,
        updated_at: now.toISOString(),
      })
      .eq("id", row.id);

    if (!error) {
      published.push({ id: row.id, slug: row.slug, seq });

      /**
       * 이 검색어는 이제 썼다. (2026-08-16)
       *
       * 그동안 집필 단계에서 `planned` 로만 옮기고 발행 뒤에 닫지 않았다.
       * 그래서 어드민 상단의 **"발행 완료"** 가 3편을 내보낸 뒤에도 계속 0 이었다.
       * 숫자가 안 움직이는 계기판은 아무도 안 본다.
       */
      if (row.keyword_id) {
        await supabase
          .from("blog_keyword")
          .update({ status: "done" })
          .eq("id", row.keyword_id);
      }
    }
  }

  /**
   * 발행하자마자 색인을 요청한다. (2026-08-14)
   *
   * 사이트맵만 두면 크롤러가 다시 올 때까지 며칠이 걸린다. 매일 한 편씩 쌓는
   * 계획에서 그 지연은 **시즌성 주제를 시즌 뒤에 색인시키는** 결과가 된다.
   * 목록과 사이트맵도 같이 밀어 넣는다 — 새 글이 어디서 링크되는지도 신호다.
   */
  if (published.length > 0) {
    await pingIndexNow([
      ...published.map((p) => `/blog/${p.slug}`),
      "/blog",
      "/sitemap.xml",
    ]);
  }

  return { published, waiting };
}
