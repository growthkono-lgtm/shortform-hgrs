import { cronRoute } from "@/lib/blog-ops";

/**
 * GET /api/blog/notify — **은퇴한 입구.** (2026-08-14)
 *
 * 원래는 발행일 15시에 "검수해 주세요" 메일을 보냈다. 그 단계가 없어졌다 —
 * 승인은 이제 `blog-runner` 의 polish 단계에서 규격 검사가 대신 찍는다.
 * 사장님 지시: "컨펌도 할 필요 없는."
 *
 * ⚠️ 파일을 지우지 않는 이유. cron-job.org 에 이 주소가 아직 등록돼 있고,
 * 지우면 404 가 되며, 404 는 곧 **사장님께 가는 실패 통지 메일**이 된다.
 * 없애려던 메일을 없애는 과정에서 메일을 만들어 낼 수는 없다.
 * 등록을 지우실 때까지 여기서 조용히 200 을 돌려준다.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = cronRoute("notify", async () => ({
  body: { retired: "검수 메일 단계는 없어졌습니다. cron 등록을 지우셔도 됩니다" },
}));
