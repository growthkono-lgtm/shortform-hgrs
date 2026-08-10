import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { ActionForm } from "@/components/admin/action-form";
import { sendBrochure, startProject } from "./actions";

const STATUS_LABEL: Record<string, string> = {
  new: "접수",
  sent: "안내 발송",
  contacted: "회신 완료",
  applied: "플랜 적용",
  closed: "종료",
};

const INTEREST_LABEL: Record<string, string> = {
  shorts_only: "숏폼 단독",
  full: "시딩 포함",
  unsure: "추천 요청",
};

const VOLUME_LABEL: Record<string, string> = {
  v1: "1편",
  v5: "5편",
  v10: "10편",
  v20: "20편+",
  unknown: "미정",
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * 신청 리스트 — 어드민의 첫 화면.
 *
 * 여기서 하는 일은 둘뿐이다. **소개서 보내기**와 **적용 시작**.
 * 적용 시작 버튼은 각 신청 줄의 오른쪽에 붙는다 — 목록에서 바로 눌러야 한다.
 */
export default async function AdminInquiriesPage() {
  const admin = createAdminClient();

  const [{ data: inquiries }, { data: plans }, { data: mails }] = await Promise.all([
    admin
      .from("inquiries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("plans")
      .select("id, code, tier, label, composition, beta_price, sort_order")
      .eq("active", true)
      .order("code")
      .order("sort_order"),
    admin
      .from("email_log")
      .select("id, kind, to_email, status, error, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const rows = inquiries ?? [];
  const waiting = rows.filter((r) => r.status !== "applied" && r.status !== "closed");

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold">신청 {rows.length}건</h1>
        <p className="text-sm text-muted">처리 대기 {waiting.length}건</p>
      </div>

      {rows.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-line bg-paper-alt p-10 text-center text-sm text-muted">
          아직 접수된 신청이 없습니다.
        </p>
      ) : (
        <ul className="mt-8 space-y-4">
          {rows.map((row) => {
            const diagnosis = row.diagnosis as {
              plan?: { label?: string; composition?: string };
            } | null;

            return (
              <li
                key={row.id}
                className="rounded-2xl border border-line bg-paper p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-bold">{row.company_name}</span>
                      <span className="text-sm text-muted">{row.contact_name}</span>
                      <span className="rounded-full bg-paper-alt px-2.5 py-0.5 text-[0.6875rem] font-bold">
                        {STATUS_LABEL[row.status] ?? row.status}
                      </span>
                    </p>
                    <p className="mt-1.5 text-xs break-all text-muted">
                      {row.email}
                      {row.phone && ` · ${row.phone}`}
                      {` · ${fmt(row.created_at)}`}
                    </p>
                    <p className="mt-2 text-xs text-muted">
                      관심 {INTEREST_LABEL[row.interest] ?? row.interest} · 편수{" "}
                      {VOLUME_LABEL[row.volume] ?? row.volume}
                      {diagnosis?.plan?.label &&
                        ` · 진단 ${diagnosis.plan.label} (${diagnosis.plan.composition})`}
                    </p>
                    {row.brand_url && (
                      <a
                        href={row.brand_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1.5 block text-xs break-all text-accent-deep underline underline-offset-2"
                      >
                        {row.brand_url}
                      </a>
                    )}
                    {row.message && (
                      <p className="mt-3 rounded-xl bg-paper-alt px-4 py-3 text-xs leading-[1.8] whitespace-pre-wrap text-muted">
                        {row.message}
                      </p>
                    )}
                  </div>

                  {/* 오른쪽 = 이 줄에서 바로 하는 두 가지 */}
                  <div className="flex shrink-0 flex-col items-end gap-2.5">
                    {row.project_id ? (
                      <Link
                        href={`/admin/projects/${row.project_id}`}
                        className="rounded-lg bg-ink px-3.5 py-2 text-xs font-bold text-paper"
                      >
                        프로젝트 열기
                      </Link>
                    ) : (
                      <ActionForm
                        action={startProject}
                        label="적용 시작"
                        className="flex flex-col items-end gap-2"
                      >
                        <input type="hidden" name="inquiry_id" value={row.id} />
                        <select
                          name="plan_id"
                          required
                          defaultValue=""
                          className="rounded-lg border border-line bg-paper px-3 py-2 text-xs"
                        >
                          <option value="" disabled>
                            플랜 선택
                          </option>
                          {(plans ?? []).map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.label} · {p.composition}
                            </option>
                          ))}
                        </select>
                      </ActionForm>
                    )}

                    <ActionForm
                      action={sendBrochure}
                      label={row.brochure_sent_at ? "소개서 재발송" : "소개서 발송"}
                      variant="outline"
                      inline
                    >
                      <input type="hidden" name="inquiry_id" value={row.id} />
                    </ActionForm>

                    {/* 보내기 전에 무엇이 가는지 본다 — 단가가 실린 문서다 */}
                    <Link
                      href={`/brochure/${row.id}`}
                      target="_blank"
                      className="text-xs text-muted underline underline-offset-2 hover:text-ink"
                    >
                      소개서 미리보기
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* 발송 이력 — 메일이 실제로 나갔는지 여기서 확인한다 */}
      <section className="mt-14">
        <h2 className="text-sm font-bold">최근 메일 발송</h2>
        {!mails || mails.length === 0 ? (
          <p className="mt-3 text-xs text-muted">발송 이력이 없습니다.</p>
        ) : (
          <ul className="mt-3 space-y-1.5 text-xs">
            {mails.map((m) => (
              <li key={m.id} className="flex flex-wrap gap-x-3 text-muted">
                <span className="font-mono">{fmt(m.created_at)}</span>
                <span
                  className={
                    m.status === "sent"
                      ? "font-bold text-accent-deep"
                      : "font-bold text-red-600"
                  }
                >
                  {m.status}
                </span>
                <span>{m.kind}</span>
                <span className="break-all">{m.to_email}</span>
                {m.error && <span className="w-full text-red-600">{m.error}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
