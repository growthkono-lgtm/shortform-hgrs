import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import {
  DELIVERY_LABEL,
  deliveryTone,
  fetchResendEmail,
} from "@/lib/mail-delivery";
import { MAIL_KIND_LABEL, MAIL_STATUS_LABEL } from "@/lib/mail-labels";

/**
 * /admin/mail/[id] — **그때 정말로 나간 그 메일.**
 *
 * 사장님: *"그 내용이 제대로가는지를 보고싶은데."*
 *
 * 우리 DB 는 본문을 저장하지 않는다(메일 한 통이 수십 KB 라 이력에 쌓으면
 * 표가 무거워진다). 대신 발송 때 받아 둔 Resend 메일 ID 로 **원본을 되받아**
 * 띄운다. 재구성이 아니라 발송된 그 문서다.
 */
export const metadata = { title: "발송본" };
export const dynamic = "force-dynamic";

const TONE: Record<string, string> = {
  good: "text-accent-deep",
  bad: "text-red-600",
  wait: "text-amber-700",
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

export default async function SentMailPage(props: PageProps<"/admin/mail/[id]">) {
  const { id } = await props.params;
  const admin = createAdminClient();

  const { data: log } = await admin
    .from("email_log")
    .select("id, kind, to_email, subject, status, error, created_at, provider_id, delivery")
    .eq("id", id)
    .maybeSingle();

  if (!log) notFound();

  const mail = log.provider_id ? await fetchResendEmail(log.provider_id) : null;
  const st = MAIL_STATUS_LABEL[log.status] ?? {
    text: log.status,
    tone: "wait" as const,
  };
  const event = mail?.last_event ?? log.delivery ?? null;

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex flex-wrap gap-x-3 py-1">
      <dt className="w-24 shrink-0 text-muted">{label}</dt>
      <dd className="break-all">{value}</dd>
    </div>
  );

  return (
    <>
      <Link href="/admin/mail" className="text-xs text-muted hover:text-ink">
        ← 메일 목록
      </Link>

      <h1 className="mt-3 text-lg font-bold break-all">{log.subject}</h1>

      <dl className="mt-4 text-xs">
        {row("보낸 때", fmt(log.created_at))}
        {row("종류", MAIL_KIND_LABEL[log.kind] ?? log.kind)}
        {row("받는 사람", log.to_email)}
        {row(
          "발송",
          <span className={`font-bold ${TONE[st.tone]}`}>{st.text}</span>,
        )}
        {row(
          "도달",
          <span className={TONE[deliveryTone(event)]}>
            {event ? (DELIVERY_LABEL[event] ?? event) : "확인 안 됨"}
          </span>,
        )}
        {log.error && row("메모", <span className="text-red-600">{log.error}</span>)}
      </dl>

      {mail?.html ? (
        <iframe
          title="발송된 메일 본문"
          srcDoc={mail.html}
          sandbox=""
          className="mt-6 h-[80vh] w-full rounded-2xl border border-line bg-white"
        />
      ) : (
        <p className="mt-6 rounded-2xl border border-line bg-paper-alt p-6 text-xs leading-[1.9] text-muted">
          {log.provider_id
            ? "Resend 에서 원본을 받아오지 못했습니다. 발송 키가 없거나, 보관 기간이 지난 메일입니다."
            : "이 건은 메일 ID 를 저장하기 전(2026-08-21 이전)에 나가서 원본을 되받을 수 없습니다."}
        </p>
      )}
    </>
  );
}
