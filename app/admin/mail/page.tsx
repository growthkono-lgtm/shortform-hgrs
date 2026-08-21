import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { ActionForm } from "@/components/admin/action-form";
import { BROCHURE, brochureMail, brochureUrl } from "@/lib/mail";
import { DELIVERY_LABEL, deliveryTone } from "@/lib/mail-delivery";
import { MAIL_KIND_LABEL, MAIL_STATUS_LABEL } from "@/lib/mail-labels";
import { refreshMailDelivery, sendBrochureTest } from "../actions";

/**
 * **메일 점검 화면.** (2026-08-21)
 *
 * 사장님 질문 세 개가 그대로 이 화면의 세 칸이다.
 *
 *   ① "재발송 누르면 최종 소개서가 나가는 게 맞아?"
 *      → 지금 나가는 본문을 **그대로** 띄우고, 첨부 PDF 가 언제 자로
 *        갱신된 것인지 라이브 파일에서 직접 읽어 적는다.
 *   ② "잘 갔는지 확인할 수 있나?"
 *      → 이력에 발송 상태(우리 쪽)와 도달 상태(받는 쪽)를 나눠 적는다.
 *   ③ "그 내용이 제대로 가는지 보고 싶은데"
 *      → 각 건의 **실제 발송본**을 Resend 에서 끌어와 보여 준다.
 *        미리보기가 아니라 그때 정말로 나간 그 메일이다.
 */
export const dynamic = "force-dynamic";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const TONE: Record<string, string> = {
  good: "text-accent-deep",
  bad: "text-red-600",
  wait: "text-amber-700",
};

/**
 * 첨부로 나가는 PDF 의 **라이브 상태**를 직접 읽는다.
 *
 * 메일 첨부는 우리 서버의 파일이 아니라 `brochureUrl` 을 Resend 가 그
 * 시점에 받아 가는 구조다. 그래서 "최종본이 나가느냐" 의 답은 내 노트북의
 * public/ 이 아니라 **이 URL 이 지금 무엇을 돌려주느냐**에 달려 있다.
 * 그 값을 추측하지 않고 HEAD 로 물어본다.
 */
async function brochureFile() {
  try {
    const res = await fetch(brochureUrl, {
      method: "HEAD",
      cache: "no-store",
    });
    if (!res.ok) return { ok: false as const, status: res.status };
    const size = Number(res.headers.get("content-length") ?? 0);
    return {
      ok: true as const,
      size,
      lastModified: res.headers.get("last-modified"),
    };
  } catch {
    return { ok: false as const, status: 0 };
  }
}

export default async function AdminMailPage() {
  const admin = createAdminClient();

  const [{ data: logs }, file] = await Promise.all([
    admin
      .from("email_log")
      .select(
        "id, kind, to_email, subject, status, error, created_at, provider_id, delivery, delivery_checked_at",
      )
      .order("created_at", { ascending: false })
      .limit(60),
    brochureFile(),
  ]);

  const preview = brochureMail({ contact_name: "홍길동", company_name: null });

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold">메일</h1>
        <p className="text-sm text-muted">
          나가는 내용과 실제 도달 여부를 한 자리에서 본다
        </p>
      </div>

      {/* ── ① 지금 나가는 소개서 ───────────────────────────────────── */}
      <section className="mt-8 rounded-2xl border border-line p-6">
        <h2 className="text-sm font-bold">지금 [소개서 발송]을 누르면 나가는 것</h2>
        <p className="mt-2 text-xs leading-[1.8] text-muted">
          본문은 발송할 때마다 새로 만들어진다 — 아래 미리보기가 곧 실제
          발송본이다. 첨부 PDF 는 파일을 메일에 넣어 두는 게 아니라{" "}
          <b className="text-ink">발송 순간 아래 주소에서 받아 간다.</b> 그래서
          소개서를 다시 만들어 배포했다면 재발송은 항상 최신본이 나간다.
        </p>

        <dl className="mt-4 space-y-1.5 text-xs">
          <div className="flex flex-wrap gap-x-3">
            <dt className="w-24 shrink-0 text-muted">제목</dt>
            <dd className="font-mono break-all">{preview.subject}</dd>
          </div>
          <div className="flex flex-wrap gap-x-3">
            <dt className="w-24 shrink-0 text-muted">첨부 파일명</dt>
            <dd>{BROCHURE.filename}</dd>
          </div>
          <div className="flex flex-wrap gap-x-3">
            <dt className="w-24 shrink-0 text-muted">첨부 원본</dt>
            <dd className="break-all">
              <a
                href={brochureUrl}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                {brochureUrl}
              </a>
            </dd>
          </div>
          <div className="flex flex-wrap gap-x-3">
            <dt className="w-24 shrink-0 text-muted">라이브 상태</dt>
            <dd className={file.ok ? TONE.good : TONE.bad}>
              {file.ok
                ? `정상 · ${(file.size / 1024 / 1024).toFixed(1)}MB · 갱신 ${
                    file.lastModified
                      ? fmt(new Date(file.lastModified).toISOString())
                      : "시각 미상"
                  }`
                : `열리지 않음 (HTTP ${file.status}) — 재발송하면 첨부 없이 링크만 나갑니다`}
            </dd>
          </div>
        </dl>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Link
            href="/admin/mail/preview"
            target="_blank"
            className="rounded-lg bg-ink px-3.5 py-2 text-xs font-bold text-paper"
          >
            본문 미리보기
          </Link>
          <ActionForm action={sendBrochureTest} label="나에게 시험 발송" variant="outline" inline />
        </div>
        <p className="mt-2 text-[0.6875rem] leading-[1.7] text-muted">
          시험 발송은 로그인한 어드민 계정 주소로만 갑니다. 고객에게 가는 것과
          제목·본문·첨부가 완전히 같습니다 — 확인하려고 제목에 시각을 붙일
          필요가 없습니다.
        </p>
      </section>

      {/* ── ② 발송 이력 ───────────────────────────────────────────── */}
      <section className="mt-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-bold">발송 이력 {logs?.length ?? 0}건</h2>
          <ActionForm
            action={refreshMailDelivery}
            label="도달 상태 새로고침"
            variant="outline"
            inline
          />
        </div>

        <p className="mt-2 text-xs leading-[1.8] text-muted">
          <b className="text-ink">발송</b>은 우리가 Resend 에 넘긴 결과,{" "}
          <b className="text-ink">도달</b>은 상대 메일함까지 갔는지다. 둘은 다른
          말이라 따로 적는다 — 접수는 됐는데 반송되는 경우가 있다.
        </p>

        {!logs?.length ? (
          <p className="mt-4 text-xs text-muted">발송 이력이 없습니다.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[52rem] border-collapse text-xs">
              <thead>
                <tr className="border-b border-line text-left text-muted">
                  <th className="py-2 pr-3 font-normal">시각</th>
                  <th className="py-2 pr-3 font-normal">종류</th>
                  <th className="py-2 pr-3 font-normal">받는 사람</th>
                  <th className="py-2 pr-3 font-normal">제목</th>
                  <th className="py-2 pr-3 font-normal">발송</th>
                  <th className="py-2 pr-3 font-normal">도달</th>
                  <th className="py-2 font-normal">내용</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((m) => {
                  const st = MAIL_STATUS_LABEL[m.status] ?? {
                    text: m.status,
                    tone: "wait" as const,
                  };
                  const dv = m.delivery;
                  return (
                    <tr key={m.id} className="border-b border-line/60 align-top">
                      <td className="py-2.5 pr-3 font-mono whitespace-nowrap text-muted">
                        {fmt(m.created_at)}
                      </td>
                      <td className="py-2.5 pr-3 whitespace-nowrap">
                        {MAIL_KIND_LABEL[m.kind] ?? m.kind}
                      </td>
                      <td className="py-2.5 pr-3 break-all">{m.to_email}</td>
                      <td className="py-2.5 pr-3">
                        {m.subject}
                        {m.error && (
                          <span className="mt-1 block text-[0.6875rem] leading-[1.6] text-red-600">
                            {m.error}
                          </span>
                        )}
                      </td>
                      <td
                        className={`py-2.5 pr-3 font-bold whitespace-nowrap ${TONE[st.tone]}`}
                      >
                        {st.text}
                      </td>
                      <td
                        className={`py-2.5 pr-3 whitespace-nowrap ${TONE[deliveryTone(dv)]}`}
                      >
                        {dv
                          ? (DELIVERY_LABEL[dv] ?? dv)
                          : m.provider_id
                            ? "미확인"
                            : "—"}
                      </td>
                      <td className="py-2.5 whitespace-nowrap">
                        {m.provider_id ? (
                          <Link
                            href={`/admin/mail/${m.id}`}
                            target="_blank"
                            className="underline underline-offset-2"
                          >
                            실제 발송본
                          </Link>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-4 text-[0.6875rem] leading-[1.8] text-muted">
          [실제 발송본]은 08-21 이후 나간 메일부터 열립니다 — 그 전에는 메일
          ID 를 저장하지 않아 되돌려 받을 열쇠가 없습니다.
        </p>
      </section>
    </>
  );
}
