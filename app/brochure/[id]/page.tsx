import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import { buildBrochure, type BrochureRow } from "@/lib/brochure";
import { SERVICE, COMPANY, PLAN_COPY } from "@/lib/constants";

/**
 * 소개서 — 신청한 사람에게만 링크가 가는 개인 문서.
 *
 * 랜딩에서 가격을 내렸으므로 단가는 여기서 처음 보인다. 그래서 **검색에 걸리면 안 된다**
 * (noindex). 주소는 신청서 uuid 하나로, 아는 사람만 여는 capability URL이다.
 * 로그인을 걸지 않은 건 의도다 — 소개서를 보려고 가입부터 하라는 건 순서가 뒤집힌 것이다.
 */
export const metadata: Metadata = {
  title: "플랜 안내",
  robots: { index: false, follow: false },
};

function PlanTable({
  caption,
  tagline,
  rows,
}: {
  caption: string;
  tagline: string;
  rows: BrochureRow[];
}) {
  return (
    <div className="mt-8">
      <h3 className="text-base font-bold">{caption}</h3>
      <p className="mt-1.5 text-xs leading-[1.7] text-muted">{tagline}</p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted">
              <th className="py-2.5 font-normal">구성</th>
              <th className="py-2.5 font-normal">내역</th>
              <th className="py-2.5 text-right font-normal">금액</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-line/70 align-top">
                <td className="py-3.5 pr-3 font-bold whitespace-nowrap">
                  {r.label}
                </td>
                <td className="py-3.5 pr-3 text-xs text-muted">{r.composition}</td>
                <td className="py-3.5 text-right">
                  <span className="stat-figure font-bold">{r.price}</span>
                  {r.perUnit && (
                    <span className="mt-0.5 block text-xs whitespace-nowrap text-muted">
                      {r.perUnit}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function BrochurePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // uuid 형식이 아니면 DB에 묻지도 않는다 — 주소창에 아무거나 넣어 보는 요청을 흘린다
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const admin = createAdminClient();
  const { data: inquiry } = await admin
    .from("inquiries")
    .select("id, contact_name, company_name, diagnosis")
    .eq("id", id)
    .maybeSingle();

  if (!inquiry) notFound();

  const b = buildBrochure(inquiry, SERVICE.url);

  return (
    <main className="mx-auto w-full max-w-[720px] px-5 py-12 sm:px-8 sm:py-20">
      <p className="eyebrow">Plan Guide</p>
      <h1 className="mt-4 text-2xl leading-[1.35] font-bold sm:text-3xl">
        {b.greeting}께 드리는
        <br />
        플랜 안내입니다
      </h1>
      <p className="mt-4 text-sm leading-[1.8] text-muted">
        남겨주신 진단 답변을 기준으로 지금 필요한 구성과 금액을 정리했습니다.
        아래 내용은 저희가 실제로 진행하는 방식 그대로입니다.
      </p>

      {/* ── 지금 상태 ── */}
      {b.result && b.result.notes.length > 0 && (
        <section className="mt-12">
          <p className="eyebrow">01 — 지금 상태</p>
          <ul className="mt-5 space-y-3">
            {b.result.notes.map((note) => (
              <li
                key={note}
                className="flex gap-3 text-sm leading-[1.8] text-ink-soft"
              >
                <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent" />
                {note}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── 권장 구성 ── */}
      {b.result && (
        <section className="mt-12">
          <p className="eyebrow">02 — 권장 구성</p>
          <div className="mt-5 rounded-2xl border border-ink/15 bg-paper-alt p-6 sm:p-8">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
              <div className="min-w-0">
                <p className="text-xl font-bold">{b.result.plan.label}</p>
                <p className="mt-1 text-xs text-muted">
                  {b.result.plan.composition}
                </p>
              </div>
              <p className="stat-figure text-2xl font-bold">{b.price}</p>
            </div>

            <div className="mt-6 space-y-3 border-t border-line pt-5">
              {b.result.blurbs.map((blurb) => (
                <p key={blurb} className="text-sm leading-[1.8] text-ink-soft">
                  {blurb}
                </p>
              ))}
            </div>

            {b.result.caveat && (
              <p className="mt-5 rounded-xl bg-accent/[0.07] px-4 py-3 text-xs leading-[1.8] text-accent-deep">
                {b.result.caveat}
              </p>
            )}
          </div>
        </section>
      )}

      {/* ── 전체 플랜 ── */}
      <section className="mt-12">
        <p className="eyebrow">{b.result ? "03" : "01"} — 전체 플랜</p>

        <PlanTable
          caption="싱글 · 숏폼 기획제작"
          tagline={PLAN_COPY.shorts_only.tagline}
          rows={b.singles}
        />
        <PlanTable
          caption="패키지 · 숏폼 + 인플루언서 시딩"
          tagline={PLAN_COPY.full.tagline}
          rows={b.packages}
        />

        <div className="mt-6 rounded-xl border border-line p-5">
          <p className="text-xs font-bold">패키지에 포함된 시딩 단가</p>
          <ul className="mt-3 space-y-1.5">
            {b.seeding.map((s) => (
              <li
                key={s.label}
                className="flex justify-between gap-3 text-xs text-muted"
              >
                <span>
                  {s.label} · 인플루언서 {s.count}명
                </span>
                <span className="stat-figure">{s.price}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── 진행 방식 ── */}
      <section className="mt-12">
        <p className="eyebrow">{b.result ? "04" : "02"} — 진행 방식</p>
        <p className="mt-4 text-sm leading-[1.8] text-muted">
          진행 단계는 내 프로젝트 화면에서 실시간으로 확인하실 수 있습니다.
          기획제작 요청 확정까지 <strong className="text-ink">7일</strong>이 소요됩니다.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {b.steps.map((track) => (
            <div
              key={track.track}
              className="rounded-2xl border border-line p-5"
            >
              <p className="text-sm font-bold">{track.track}</p>
              <ol className="mt-4 space-y-2.5">
                {track.stages.map((label, i) => (
                  <li key={label} className="flex gap-3 text-xs text-muted">
                    <span className="stat-figure shrink-0 text-ink">
                      {i + 1}
                    </span>
                    {label}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      {/* ── 조건 ── */}
      <section className="mt-12">
        <p className="eyebrow">{b.result ? "05" : "03"} — 진행 조건</p>
        <ul className="mt-5 space-y-2.5">
          {b.policies.map((p) => (
            <li key={p} className="flex gap-3 text-xs leading-[1.8] text-muted">
              <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-muted" />
              {p}
            </li>
          ))}
        </ul>
      </section>

      {/* ── 시작 ── */}
      <section className="mt-14 rounded-2xl bg-ink p-7 text-paper sm:p-9">
        <p className="text-lg font-bold">시작하시려면</p>
        <p className="mt-3 text-sm leading-[1.8] text-paper/70">
          가입하시면 담당자가 플랜을 적용해 드리고, 그 즉시 내 프로젝트에서
          진행 단계와 결과물을 보실 수 있습니다. 이 안내에 대한 회신은 받으신
          메일에 그대로 답장해 주시면 됩니다.
        </p>
        <Link
          href="/signup"
          className="mt-6 inline-flex rounded-full bg-paper px-6 py-3 text-sm font-bold text-ink"
        >
          가입하고 시작하기
        </Link>
      </section>

      <footer className="mt-12 border-t border-line pt-6 text-xs leading-[1.9] text-muted">
        {SERVICE.name} · {COMPANY.name}
        <br />
        사업자등록번호 {COMPANY.bizRegNumber} · {COMPANY.addressLabel}{" "}
        {COMPANY.address}
        <br />
        <a href={SERVICE.url} className="underline underline-offset-2">
          {SERVICE.url.replace("https://", "")}
        </a>
      </footer>
    </main>
  );
}
