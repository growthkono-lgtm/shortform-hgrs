import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/supabase/auth";
import { adfilmTable } from "@/lib/adfilm-db";
import { adFormat, disclosureText, sourceSeconds } from "@/lib/adfilm-formats";
import {
  briefBlocked,
  compileBrief,
  validateBrief,
  type AdBrief,
} from "@/lib/adfilm-brief";
import { GEN_COST, shotCost } from "@/lib/adfilm-gen";
import { BriefForm } from "./brief-form";
import { deleteFilm, generateShots, saveBrief } from "../actions";

/**
 * /admin/adfilm/[id] — 기획안 한 편.
 *
 * 화면이 지키는 순서가 하나 있다:
 *   **기획안 → 검사 → 프롬프트 미리보기 → 생성**
 *
 * 생성 버튼은 검사를 통과해야 열린다. 2026-08-15~16 에 돈이 샌 경로가
 * 정확히 이 순서를 건너뛴 것이었다 — 대본을 확정하지 않고 컷을 뽑았고,
 * 대사가 바뀌자 그 컷들이 통째로 폐기됐다. 대본은 공짜고 컷은 $1.5 다.
 */
export const dynamic = "force-dynamic";

export default async function AdFilmPage(props: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await props.params;

  const { data: film } = await adfilmTable()
    .select("id, title, format, stage, brief, shots, cost_usd, last_error")
    .eq("id", id)
    .maybeSingle();
  if (!film) notFound();

  const brief = film.brief as AdBrief;
  const format = adFormat(film.format);
  const issues = validateBrief(brief);
  const blocked = briefBlocked(issues);

  // 검사를 통과한 기획안만 프롬프트로 컴파일한다 — 미달이면 볼 게 없다
  const compiled = blocked ? null : compileBrief(brief);
  const estimate = format.shots.reduce(
    (s, x) => s + shotCost({ seconds: x.seconds, tier: "standard", hasVideoRef: false }),
    0,
  );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-10 sm:px-8">
      <div>
        <Link href="/admin/adfilm" className="text-xs text-muted hover:underline">
          ← AI 광고영상
        </Link>
        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-xl font-bold">{film.title ?? "(이름 없음)"}</h1>
          <span className="text-xs text-muted">
            {format.label} · {format.shots.length}샷 / {sourceSeconds(format)}초 ·
            예상 ${estimate.toFixed(2)} · 쓴 돈 $
            {Number(film.cost_usd ?? 0).toFixed(2)} / 편당 상한 $
            {GEN_COST.maxPerFilmUsd}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted">
          화면 고지: <span className="font-medium">{disclosureText(format)}</span>
        </p>
      </div>

      {film.last_error && (
        <p className="rounded-lg border border-accent/40 bg-accent/[0.06] px-3 py-2 text-xs">
          {film.last_error}
        </p>
      )}

      {/* ── 검사 결과 — 무엇 때문에 잠겨 있는지 먼저 보여 준다 ── */}
      <section
        className={`rounded-xl border p-4 ${blocked ? "border-accent/50 bg-accent/[0.05]" : "border-line"}`}
      >
        <h2 className="text-sm font-bold">
          기획안 검사 {blocked ? "— 미달 (생성 잠김)" : "— 통과"}
        </h2>
        {issues.length === 0 ? (
          <p className="mt-2 text-xs text-muted">빠진 칸이 없습니다.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1 text-xs">
            {issues.map((x, i) => (
              <li key={i} className={x.level === "block" ? "" : "text-muted"}>
                {x.level === "block" ? "✗" : "!"} {x.message}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── 기획안 ── */}
      <form action={saveBrief} className="flex flex-col gap-4">
        <input type="hidden" name="id" value={film.id} />
        <BriefForm brief={brief} format={format} />
        <button
          type="submit"
          className="self-start rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper"
        >
          기획안 저장
        </button>
      </form>

      {/* ── 프롬프트 미리보기 — 돈 쓰기 전에 눈으로 본다 ── */}
      {compiled && (
        <section className="rounded-xl border border-line p-4">
          <h2 className="text-sm font-bold">
            생성될 프롬프트 {compiled.prompts.length}개
          </h2>
          <p className="mt-1 text-xs text-muted">
            레퍼런스 순서:{" "}
            {compiled.refs.map((r) => `${r.tag} ${r.label}`).join(" · ") || "없음"}
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {compiled.prompts.map((p) => (
              <details key={p.no} className="rounded-lg border border-line p-2">
                <summary className="cursor-pointer text-xs font-medium">
                  샷 {p.no} · {p.seconds}초
                  {p.line ? ` · “${p.line}”` : ""}
                </summary>
                <pre className="mt-2 overflow-x-auto text-[0.7rem] leading-relaxed whitespace-pre-wrap text-muted">
                  {p.prompt}
                </pre>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* ── 생성 ── */}
      <form action={generateShots} className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="id" value={film.id} />
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted">품질</span>
          <select
            name="tier"
            className="rounded-lg border border-line bg-paper px-3 py-2 text-sm"
          >
            <option value="standard">standard (마감용)</option>
            <option value="fast">fast (탐색용, 20% 저렴)</option>
          </select>
        </label>
        <button
          type="submit"
          disabled={blocked}
          className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper disabled:cursor-not-allowed disabled:opacity-35"
        >
          {blocked
            ? "기획안 미달 — 생성 잠김"
            : `${format.shots.length}컷 생성 ($${estimate.toFixed(2)})`}
        </button>
      </form>

      {/* ── 생성 결과 ── */}
      {Array.isArray(film.shots) && film.shots.length > 0 && (
        <section className="rounded-xl border border-line p-4">
          <h2 className="text-sm font-bold">생성 작업 {film.shots.length}건</h2>
          <ul className="mt-2 flex flex-col gap-1 text-xs text-muted">
            {(film.shots as { no: number; requestId: string; line?: string }[]).map(
              (s) => (
                <li key={s.requestId}>
                  샷 {s.no} · {s.requestId.slice(0, 8)}…
                  {s.line ? ` · “${s.line}”` : ""}
                </li>
              ),
            )}
          </ul>
        </section>
      )}

      <form action={deleteFilm}>
        <input type="hidden" name="id" value={film.id} />
        <button type="submit" className="text-xs text-muted hover:text-ink">
          이 편 지우기
        </button>
      </form>
    </div>
  );
}
