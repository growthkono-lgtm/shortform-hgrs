import { cronRoute } from "@/lib/blog-ops";

/**
 * GET /api/blog/remind — **은퇴한 입구.** (2026-08-14)
 *
 * 원래는 발행일 오전 11시에 "맥 켜 두세요" 메일을 보냈다. 원고를 사장님 맥의
 * Claude Code 가 썼기 때문이다. 이제 원고는 서버가 OpenAI 로 쓴다 —
 * 맥이 꺼져 있어도, 사장님이 해외에 계셔도 돈다.
 *
 * 파일을 남겨 둔 이유는 `notify/route.ts` 머리말과 같다: 등록된 cron 이
 * 404 를 받으면 그게 실패 통지 메일이 된다.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = cronRoute("remind", async () => ({
  body: { retired: "사전 알림 단계는 없어졌습니다. cron 등록을 지우셔도 됩니다" },
}));
