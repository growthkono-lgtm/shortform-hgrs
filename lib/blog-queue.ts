import "server-only";

import { TOPIC_QUEUE, type QueuedTopic } from "@/lib/blog-schedule";
import { queueBlockReasons } from "@/lib/keyword-filter";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * 편성 큐에서 **지금 쓸 수 있는 것만** 남긴다. (2026-08-19 저녁 신설)
 *
 * ── 왜 만들었나 ────────────────────────────────────────────────────────
 * 사장님이 편성표 스크린샷을 주셨다. `스마트스토어상품등록대행`(510) 이
 * **#6(오늘 발행분)과 7(내일 슬롯) 두 줄에 같이** 떠 있었다.
 *
 * 원인은 두 곳이 서로 다른 기준을 들고 있었던 것이다.
 *
 *   `lib/blog-runner.ts`  큐에서 뽑을 때 `taken`(이미 쓴 검색어)을 걸렀다
 *   `lib/blog-admin.ts`   화면에 뿌릴 때 **아무것도 안 걸렀다**
 *
 * 그래서 실제 발행은 안 되는데 표는 그걸 내일 쓸 것처럼 보여 줬다.
 * 표가 거짓말을 하면 그 표를 보고 하는 모든 판단이 틀어진다.
 *
 * ── 더 큰 구멍 ────────────────────────────────────────────────────────
 * 그리고 큐 자체가 새 기준(08-19)을 **한 번도 안 통과했다.** 34개를 실제로
 * 검증해 보니 12개가 부적격이었다 —
 *
 *   관련성 탈락 2개 (`스마트스토어상품등록대행`·`인스타스토리광고`)
 *   검색량 1,000 미달 8개 (110 ~ 930)
 *   이미 쓴 것 4개
 *
 * 오전에 관련성·하한 규칙을 세우면서 **DB 풀에만 적용하고 큐는 그대로 뒀다.**
 * 큐는 DB 보다 우선순위가 높아서(`blog-runner` 가 큐를 먼저 본다), 관문을
 * 세워 놓고 그 앞의 우회로를 열어 둔 셈이 됐다. `스마트스토어상품등록대행`
 * 로 오늘 편이 나간 경로가 정확히 이것이다.
 *
 * ── 그래서 판정을 한 곳에 둔다 ────────────────────────────────────────
 * 편성(runner)과 표시(admin)가 **이 함수 하나만** 부른다. 두 벌이면 반드시
 * 어긋나고, 오늘 하루에만 같은 종류로 세 번 어긋났다(키워드 판정, 편성 큐,
 * 1,000행 절단).
 */

export type QueueEntry = QueuedTopic & {
  /** DB 에 잡힌 실측 검색량. 없으면 null */
  volume: number | null;
};

export type QueueAudit = {
  /** 지금 쓸 수 있는 것 */
  usable: QueueEntry[];
  /** 못 쓰는 것과 그 이유 — 어드민에 그대로 보여 준다 */
  blocked: { term: string; volume: number | null; reasons: string[] }[];
};

export async function auditQueue(): Promise<QueueAudit> {
  const supabase = createAdminClient();

  /** 이미 쓴 검색어. 스테이지·성공 여부와 무관하게 전부 — 한 번 손댔으면 쓴 것이다 */
  const { data: jobs } = await supabase.from("blog_job").select("keyword_term");
  const taken = new Set(
    (jobs ?? []).map((j) => j.keyword_term).filter(Boolean) as string[],
  );

  const terms = TOPIC_QUEUE.map((t) => t.term);
  const { data: rows } = await supabase
    .from("blog_keyword")
    .select("term, total_volume, status")
    .in("term", terms);
  const byTerm = new Map(
    (rows ?? []).map((r) => [r.term, r] as const),
  );

  const usable: QueueEntry[] = [];
  const blocked: QueueAudit["blocked"] = [];

  for (const t of TOPIC_QUEUE) {
    const db = byTerm.get(t.term);
    const volume = db?.total_volume ?? null;
    /** 판정은 `lib/keyword-filter.ts` — 스크립트로도 같은 함수를 돌려 본다 */
    const reasons = queueBlockReasons({
      term: t.term,
      volume,
      status: db?.status ?? null,
      taken: taken.has(t.term),
    });

    if (reasons.length) blocked.push({ term: t.term, volume, reasons });
    else usable.push({ ...t, volume });
  }

  return { usable, blocked };
}
