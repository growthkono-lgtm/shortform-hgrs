/**
 * Search Console 이 실제로 숫자를 주는지 확인한다. (2026-08-16)
 *
 *   npx tsx --env-file=.env.local scripts/blog-search-check.ts
 *
 * 어드민 편성표의 **노출·순위** 칸이 비어 있을 때, 성과가 없는 것인지
 * 측정이 안 되는 것인지 가르는 자리다. 둘은 완전히 다른 얘기다.
 *
 * ⚠️ 로컬 `.env.local` 에는 구글 서비스 계정 값이 비어 있다(Vercel 프로덕션에만
 * 있다). 로컬에서 돌리면 "설정 안 됨" 이 정상이고, 진짜 확인은 배포된 어드민
 * 화면 상단의 연결 상태 배너로 한다.
 */
import { searchConsoleConfigured, searchSummary } from "../lib/search-console";

async function main() {
  console.log("환경변수 설정됨:", searchConsoleConfigured());

  const s = await searchSummary();
  console.log("연결 상태:", s.ok ? "✅ 읽고 있음" : "❌ 못 읽음");
  if (!s.ok) console.log("이유:", s.reason);
  console.log(
    `합계 — 노출 ${s.impressions} · 클릭 ${s.clicks} · 평균순위 ${s.position?.toFixed(1)}`,
  );

  if (s.queries.length) {
    console.table(
      s.queries.slice(0, 15).map((q) => ({
        검색어: q.key,
        노출: q.impressions,
        클릭: q.clicks,
        순위: q.position.toFixed(1),
      })),
    );
  }
  if (s.risen.length) {
    console.log("순위가 오른 검색어:");
    for (const r of s.risen) console.log(` ${r.key}: ${r.from}위 → ${r.to}위`);
  }
}

main();
