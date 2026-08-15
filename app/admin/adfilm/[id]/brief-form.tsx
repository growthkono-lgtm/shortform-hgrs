"use client";

import { useMemo, useState } from "react";

import type { AdFormat } from "@/lib/adfilm-formats";
import type { AdBrief, ProductFact } from "@/lib/adfilm-brief";

/**
 * 기획안 입력 폼 — 어드민의 "칸".
 *
 * 사장님이 2026-08-14 에 주신 기획안이 칸 1~9 구조였다. 그 칸을 그대로 화면에
 * 옮긴 것이 이 폼이다. 여기 채워진 값이 곧 프롬프트가 되므로, **화면에 없는
 * 칸은 영상에도 안 들어간다.** 그래서 칸을 빠뜨리지 않는 게 이 파일의 일이다.
 *
 * 상태를 통째로 JSON 으로 들고 있다가 hidden input 하나로 넘긴다.
 * 칸이 유형마다 달라서 name= 을 일일이 맞추면 유형을 늘릴 때마다 폼을 고쳐야 한다.
 */
export function BriefForm({
  brief: initial,
  format,
}: {
  brief: AdBrief;
  format: AdFormat;
}) {
  const [brief, setBrief] = useState<AdBrief>(initial);

  const set = <K extends keyof AdBrief>(key: K, value: AdBrief[K]) =>
    setBrief((b) => ({ ...b, [key]: value }));

  const setShot = (no: number, patch: Partial<AdBrief["shots"][number]>) =>
    setBrief((b) => ({
      ...b,
      shots: b.shots.map((s) => (s.no === no ? { ...s, ...patch } : s)),
    }));

  const setFact = (i: number, patch: Partial<ProductFact>) =>
    setBrief((b) => ({
      ...b,
      facts: b.facts.map((f, n) => (n === i ? { ...f, ...patch } : f)),
    }));

  /** 대사 전체 — 팩트가 실렸는지 화면에서 바로 보여 준다 */
  const script = useMemo(
    () => brief.shots.map((s) => s.line ?? "").join(" "),
    [brief.shots],
  );

  const box =
    "w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm";
  const label = "text-xs font-medium text-muted";

  return (
    <>
      <input type="hidden" name="brief" value={JSON.stringify(brief)} />

      {/* ── 칸 1 · 제품 팩트 ─────────────────────────────────────── */}
      <section className="rounded-xl border border-line p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-bold">칸 1 · 제품 팩트</h2>
          <span className="text-xs text-muted">
            &lsquo;대사에 필수&rsquo; 를 켠 팩트는 대사에 안 나오면 생성이 잠깁니다
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-2">
          {brief.facts.map((f, i) => {
            const said = f.keywords.some(
              (k) => k.trim() && script.includes(k.trim()),
            );
            return (
              <div
                key={i}
                className="grid gap-2 rounded-lg border border-line p-2 sm:grid-cols-[1fr_1.4fr_1fr_auto]"
              >
                <input
                  className={box}
                  placeholder="항목 (예: 기능)"
                  value={f.label}
                  onChange={(e) => setFact(i, { label: e.target.value })}
                />
                <input
                  className={box}
                  placeholder="값 (예: 긁기·소변마킹·숨기·환경변화)"
                  value={f.value}
                  onChange={(e) => setFact(i, { value: e.target.value })}
                />
                <input
                  className={box}
                  placeholder="근거 (패키지/공식/임상)"
                  value={f.source}
                  onChange={(e) => setFact(i, { source: e.target.value })}
                />
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <label className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={f.mustSay}
                      onChange={(e) =>
                        setFact(i, { mustSay: e.target.checked })
                      }
                    />
                    대사 필수
                  </label>
                  <button
                    type="button"
                    className="text-xs text-muted hover:text-ink"
                    onClick={() =>
                      set(
                        "facts",
                        brief.facts.filter((_, n) => n !== i),
                      )
                    }
                  >
                    ✕
                  </button>
                </div>
                <input
                  className={`${box} sm:col-span-4`}
                  placeholder="대사에 나왔는지 판정할 낱말 (쉼표로 구분) — 예: 긁, 오줌, 숨, 환경"
                  value={f.keywords.join(", ")}
                  onChange={(e) =>
                    setFact(i, {
                      keywords: e.target.value.split(",").map((x) => x.trim()),
                    })
                  }
                />
                {f.mustSay && (
                  <p
                    className={`sm:col-span-4 text-xs ${said ? "text-muted" : "text-accent-deep"}`}
                  >
                    {said ? "✓ 대사에 실렸습니다" : "✗ 아직 대사에 없습니다"}
                  </p>
                )}
              </div>
            );
          })}
          <button
            type="button"
            className="self-start rounded-lg border border-line px-3 py-1.5 text-xs"
            onClick={() =>
              set("facts", [
                ...brief.facts,
                {
                  label: "",
                  value: "",
                  source: "",
                  mustSay: true,
                  keywords: [],
                },
              ])
            }
          >
            + 팩트 추가
          </button>
        </div>
      </section>

      {/* ── 칸 2~4 ───────────────────────────────────────────────── */}
      <section className="grid gap-3 rounded-xl border border-line p-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className={label}>칸 2 · 근거 (임상·수치). 지어내지 않는다</span>
          <textarea
            className={box}
            rows={2}
            value={brief.evidence}
            onChange={(e) => set("evidence", e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={label}>칸 3 · 타겟 (살 사람 / 안 살 사람)</span>
          <textarea
            className={box}
            rows={2}
            value={brief.audience}
            onChange={(e) => set("audience", e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={label}>칸 4 · 핵심 USP — 하나만</span>
          <textarea
            className={box}
            rows={2}
            value={brief.usp}
            onChange={(e) => set("usp", e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={label}>제품명</span>
          <input
            className={box}
            value={brief.product}
            onChange={(e) => set("product", e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={label}>T.P.O — 언제·어디서·어떤 상황</span>
          <input
            className={box}
            value={brief.tpo}
            onChange={(e) => set("tpo", e.target.value)}
          />
        </label>
      </section>

      {/* ── 칸 5 · 비주얼 클라이맥스 ─────────────────────────────── */}
      <section className="rounded-xl border border-accent/40 bg-accent/[0.04] p-4">
        <h2 className="text-sm font-bold">칸 5 · 비주얼 클라이맥스 ★</h2>
        <p className="mt-1 text-xs text-muted">
          비포와 애프터를 한 쌍으로. 한쪽만 있으면 대비가 성립하지 않아 생성이 잠깁니다.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className={label}>비포</span>
            <input
              className={box}
              placeholder="예: 웅크리고 자던 모습"
              value={brief.climax?.before ?? ""}
              onChange={(e) =>
                set("climax", { ...brief.climax, before: e.target.value })
              }
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={label}>애프터</span>
            <input
              className={box}
              placeholder="예: 대자로 뻗어서 자는 모습"
              value={brief.climax?.after ?? ""}
              onChange={(e) =>
                set("climax", { ...brief.climax, after: e.target.value })
              }
            />
          </label>
        </div>
      </section>

      {/* ── 화자 ─────────────────────────────────────────────────── */}
      {format.refs.some((r) => r.key === "talent_face") && (
        <section className="grid gap-3 rounded-xl border border-line p-4 sm:grid-cols-3">
          {(["age", "gender", "tone"] as const).map((k) => (
            <label key={k} className="flex flex-col gap-1">
              <span className={label}>
                화자 · {k === "age" ? "나이대" : k === "gender" ? "성별" : "톤"}
              </span>
              <input
                className={box}
                value={brief.talent?.[k] ?? ""}
                onChange={(e) =>
                  set("talent", {
                    age: brief.talent?.age ?? "",
                    gender: brief.talent?.gender ?? "",
                    tone: brief.talent?.tone ?? "",
                    [k]: e.target.value,
                  })
                }
              />
            </label>
          ))}
        </section>
      )}

      {/* ── 레퍼런스 자산 ─────────────────────────────────────────── */}
      <section className="rounded-xl border border-line p-4">
        <h2 className="text-sm font-bold">레퍼런스 자산</h2>
        <p className="mt-1 text-xs text-muted">
          이 값이 프롬프트의 [Image1] 순서를 정합니다. 아래 업로드 칸에서 올린 URL 을 넣으세요.
        </p>
        <div className="mt-3 flex flex-col gap-3">
          {format.refs.map((slot) => {
            const mine = brief.assets.filter((a) => a.slot === slot.key);
            return (
              <div key={slot.key}>
                <p className="text-xs">
                  <span className="font-medium">{slot.label}</span>
                  <span
                    className={
                      mine.length < slot.min ? "ml-2 text-accent-deep" : "ml-2 text-muted"
                    }
                  >
                    {mine.length}/{slot.min}장
                  </span>
                  <span className="ml-2 text-muted">{slot.why}</span>
                </p>
                <div className="mt-1 flex flex-col gap-1">
                  {mine.map((a, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        className={box}
                        value={a.file}
                        placeholder="https://…"
                        onChange={(e) =>
                          set(
                            "assets",
                            brief.assets.map((x) =>
                              x === a ? { ...x, file: e.target.value } : x,
                            ),
                          )
                        }
                      />
                      <button
                        type="button"
                        className="text-xs text-muted hover:text-ink"
                        onClick={() =>
                          set(
                            "assets",
                            brief.assets.filter((x) => x !== a),
                          )
                        }
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="self-start text-xs text-accent-deep"
                    onClick={() =>
                      set("assets", [
                        ...brief.assets,
                        { slot: slot.key, file: "" },
                      ])
                    }
                  >
                    + {slot.label} 추가
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 칸 6·7 · 샷별 대사와 화면 ─────────────────────────────── */}
      <section className="rounded-xl border border-line p-4">
        <h2 className="text-sm font-bold">
          칸 6·7 · 샷 {format.shots.length}개 ({format.shots[0]?.seconds ?? 5}초씩)
        </h2>
        <div className="mt-3 flex flex-col gap-3">
          {format.shots.map((slot) => {
            const s = brief.shots.find((x) => x.no === slot.no);
            const words = (s?.line ?? "").trim().split(/\s+/).filter(Boolean).length;
            return (
              <div key={slot.no} className="rounded-lg border border-line p-3">
                <p className="text-xs">
                  <span className="font-bold">
                    샷 {slot.no} · {slot.role}
                  </span>
                  <span className="ml-2 text-muted">참고: {slot.must}</span>
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <input
                    className={box}
                    placeholder="카메라"
                    value={s?.camera ?? ""}
                    onChange={(e) => setShot(slot.no, { camera: e.target.value })}
                  />
                  <input
                    className={box}
                    placeholder="동작"
                    value={s?.action ?? ""}
                    onChange={(e) => setShot(slot.no, { action: e.target.value })}
                  />
                  <input
                    className={`${box} sm:col-span-2`}
                    placeholder="이 컷에 반드시 담길 것 ← 의도대로 나오게 하는 줄"
                    value={s?.must ?? ""}
                    onChange={(e) => setShot(slot.no, { must: e.target.value })}
                  />
                  {format.audio === "onscreen" && (
                    <label className="flex flex-col gap-1 sm:col-span-2">
                      <span className={label}>
                        대사{" "}
                        <span
                          className={
                            words > 10 || words < 3 ? "text-accent-deep" : ""
                          }
                        >
                          {words}어절 (3~10)
                        </span>
                      </span>
                      <input
                        className={box}
                        value={s?.line ?? ""}
                        onChange={(e) => setShot(slot.no, { line: e.target.value })}
                      />
                    </label>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <label className="mt-3 flex flex-col gap-1">
          <span className={label}>행동 문구 (화면에 박힌다)</span>
          <input
            className={box}
            value={brief.cta}
            onChange={(e) => set("cta", e.target.value)}
          />
        </label>
      </section>
    </>
  );
}
