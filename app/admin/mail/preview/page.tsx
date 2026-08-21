import { BROCHURE, brochureMail } from "@/lib/mail";

/**
 * /admin/mail/preview — **지금 나가는 소개서 메일 본문 그대로.**
 *
 * 스크린샷을 새로 찍어 붙이는 미리보기가 아니다. 실제 발송이 쓰는
 * `brochureMail()` 을 그 자리에서 불러 그 HTML 을 그대로 띄운다.
 * 코드가 바뀌면 이 화면도 같이 바뀐다 — 어긋날 수가 없다.
 *
 * iframe 에 sandbox 를 걸어 둔 이유는 메일 HTML 이 어드민 페이지의
 * 스타일이나 스크립트에 손대지 못하게 하기 위해서다.
 */
export const metadata = { title: "소개서 메일 미리보기" };
export const dynamic = "force-dynamic";

export default async function BrochurePreviewPage() {
  const mail = brochureMail({ contact_name: "홍길동", company_name: null });

  return (
    <>
      <p className="text-xs text-muted">지금 발송되는 본문 그대로</p>
      <h1 className="mt-1 text-lg font-bold break-all">{mail.subject}</h1>
      <p className="mt-2 text-xs leading-[1.8] text-muted">
        여기에 <b className="text-ink">{BROCHURE.filename}</b> 가
        첨부로 함께 나갑니다. 인사말의 이름 자리는 받는 분에 따라 바뀝니다.
      </p>

      <iframe
        title="소개서 메일 본문"
        srcDoc={mail.html}
        sandbox=""
        className="mt-6 h-[80vh] w-full rounded-2xl border border-line bg-white"
      />
    </>
  );
}
