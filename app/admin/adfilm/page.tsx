import Link from "next/link";

import { requireAdmin } from "@/lib/supabase/auth";
import { adfilmTable } from "@/lib/adfilm-db";
import { AD_FORMATS, adFormat, sourceSeconds } from "@/lib/adfilm-formats";
import { validateBrief, briefBlocked, type AdBrief } from "@/lib/adfilm-brief";
import { GEN_COST } from "@/lib/adfilm-gen";
import { createFilm } from "./actions";

/**
 * /admin/adfilm — AI 광고영상 공장.
 *
 * 사장님 지시(2026-08-14): *"작업자 보드에 프롬프트를 UI로 옮겨놓고
 * 기획제작 공장처럼 돌리고 싶거든."*
 *
 * 이 목록의 일은 하나다 — **어느 편이 기획안 미달이라 아직 돈을 못 쓰는지**
 * 를 한눈에 보여 주는 것. 규격 통과가 곧 생성 허가다.
 */
export const dynamic = "force-dynamic";

const STAGE_LABEL: Record<string, string> = {
  draft: "기획 중",
  generating: "생성 중",
  composing: "조립 중",
  review: "검수",
  done: "완료",
  failed: "실패",
};

export default async function AdFilmListPage() {
  await requireAdmin();

  const { data } = await adfilmTable()
    .select("id, title, format, stage, brief, cost_usd, seconds, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = data ?? [];
  const monthSpent = rows.reduce((s, r) => s + Number(r.cost_usd ?? 0), 0);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-xl font-bold">AI 광고영상</h1>
        <span className="text-xs text-muted tabular-nums">
          이번 달 ${monthSpent.toFixed(2)} / 상한 ${GEN_COST.maxPerMonthUsd}
          {" · "}편당 상한 ${GEN_COST.maxPerFilmUsd}
        </span>
      </div>

      {/* ── 새 편 ── 유형을 먼저 고른다. 유형이 샷 구성과 검사 항목을 정한다 */}
      <form
        action={createFilm}
        className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-line bg-paper-alt p-4"
      >
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted">이름</span>
          <input
            name="title"
            required
            placeholder="예: 펠리웨이 클래식 30초"
            className="w-64 rounded-lg border border-line bg-paper px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted">영상 유형</span>
          <select
            name="format"
            className="rounded-lg border border-line bg-paper px-3 py-2 text-sm"
          >
            {AD_FORMATS.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label} — {f.shots.length}샷 / {sourceSeconds(f)}초
                {f.photoreal ? "" : " · 비실사"}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper"
        >
          새 편 만들기
        </button>
      </form>

      {/* ── 유형 안내 — 규제 표기가 유형에서 자동으로 결정된다 */}
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {AD_FORMATS.map((f) => (
          <div
            key={f.key}
            className="rounded-lg border border-line px-3 py-2 text-xs leading-relaxed"
          >
            <span className="font-bold">{f.label}</span>
            <span className="ml-1.5 text-muted">
              {f.minSeconds}~{f.maxSeconds}초 ·{" "}
              {f.audio === "onscreen"
                ? "인물 발화"
                : f.audio === "voiceover"
                  ? "보이스오버"
                  : "무음"}
            </span>
            <p className="mt-1 text-muted">{f.brief}</p>
            <p className="mt-1 text-[0.7rem] text-muted">
              표기:{" "}
              {f.labeling === "ai+virtual" ? "AI + 가상인물" : "AI 생성"}
            </p>
          </div>
        ))}
      </div>

      {/* ── 목록 */}
      <div className="mt-8 overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead className="bg-paper-alt text-xs text-muted">
            <tr>
              <th className="px-3 py-2 text-left font-medium">이름</th>
              <th className="px-3 py-2 text-left font-medium">유형</th>
              <th className="px-3 py-2 text-left font-medium">상태</th>
              <th className="px-3 py-2 text-left font-medium">기획안</th>
              <th className="px-3 py-2 text-right font-medium">비용</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-muted">
                  아직 없습니다. 위에서 유형을 고르고 새 편을 만드세요.
                </td>
              </tr>
            )}
            {rows.map((r) => {
              const issues = validateBrief(r.brief as AdBrief);
              const blocked = briefBlocked(issues);
              const blocks = issues.filter((x) => x.level === "block").length;
              return (
                <tr key={r.id} className="border-t border-line">
                  <td className="px-3 py-2">
                    <Link
                      href={`/admin/adfilm/${r.id}`}
                      className="font-medium underline-offset-2 hover:underline"
                    >
                      {r.title ?? "(이름 없음)"}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-muted">
                    {(() => {
                      try {
                        return adFormat(r.format).label;
                      } catch {
                        return r.format;
                      }
                    })()}
                  </td>
                  <td className="px-3 py-2 text-muted">
                    {STAGE_LABEL[r.stage] ?? r.stage}
                  </td>
                  <td className="px-3 py-2">
                    {blocked ? (
                      <span className="text-accent-deep">
                        미달 {blocks}건 — 생성 잠김
                      </span>
                    ) : (
                      <span className="text-muted">통과</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-muted">
                    ${Number(r.cost_usd ?? 0).toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
