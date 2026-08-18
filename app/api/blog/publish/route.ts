import { revalidatePath } from "next/cache";

import { cronRoute } from "@/lib/blog-ops";
import { publishDue } from "@/lib/blog-publish";

/**
 * GET /api/blog/publish — 승인된 글을 예약 시각(예정일 17시)에 내보낸다.
 *
 * cron-job.org 가 부른다. 승인 도장이 없는 글은 예정일이 아무리 지나도
 * 건드리지 않는다.
 *
 * 다만 **승인 도장을 찍는 손이 바뀌었다**(2026-08-14). 예전엔 사장님이
 * 어드민에서 누르셨고, 지금은 `blog-runner` 의 polish 단계가 규격 검사를
 * 통과시켰을 때 찍는다. 규격 미달로 두 번 고쳐도 안 되면 도장이 안 찍히고,
 * 그 회차는 조용히 걸러진다. 발행 조건 자체는 한 글자도 안 바뀌었다.
 *
 * 알림 메일은 여기서 보내지 않는다. `/api/blog/announce` 가 따로 맡는다 —
 * 저녁 8시 이후에 발행되면 메일은 아침까지 기다려야 하기 때문에,
 * 발행과 알림을 한 함수에 묶으면 둘 중 하나가 늘 어긋난다.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = cronRoute("publish", async (now) => {
  const result = await publishDue(now);

  if (result.published.length > 0) {
    revalidatePath("/blog");
    revalidatePath("/sitemap.xml");
    revalidatePath("/admin/blog");
    for (const p of result.published) revalidatePath(`/blog/${p.slug}`);
  }

  return {
    note: result.published.length
      ? `발행 ${result.published.map((p) => `#${p.seq ?? "-"} ${p.slug}`).join(", ")}`
      : undefined,
    body: {
      published: result.published.map((p) => ({ slug: p.slug, seq: p.seq })),
      waiting: result.waiting,
    },
  };
});
