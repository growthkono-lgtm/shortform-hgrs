import { createAdminClient } from "@/lib/supabase/server";
import { SERVICE } from "@/lib/constants";
/** 소개서를 보낼 신청 건 — 인사말에 쓰는 이름만 필요하다 */
export type BrochureInquiry = {
  contact_name: string;
  company_name: string | null;
};

/** `npm run deck` 이 만들어 public/ 에 두는 소개서 파일명 */
const BROCHURE_FILE = "hgrs-shortform-studio-brochure.pdf";

/**
 * 자동 메일 발송.
 *
 * 지금은 **Resend 키가 없으면 조용히 건너뛰고 email_log 에 skipped 로 남긴다.**
 * 발송이 안 됐는데 화면은 성공으로 보이는 게 제일 위험하므로, 어드민 목록에서
 * 발송 결과를 눈으로 확인할 수 있게 이력을 반드시 남긴다.
 *
 * 회신은 contact@h-grs.com 으로 모은다.
 */
/**
 * 발신은 **Resend에서 인증된 도메인**이어야 한다. h-grs.com 은 아직 미인증이라
 * 발신 주소는 hgrs.io 를 쓰고, 회신은 contact@h-grs.com 으로 받는다.
 * (h-grs.com 을 Resend에 인증해 두면 발신 주소도 그대로 옮길 수 있다)
 */
const FROM = process.env.NOTIFY_FROM_EMAIL || "해그로시 숏폼 스튜디오 <contact@hgrs.io>";
const REPLY_TO = "contact@h-grs.com";

export type MailKind = "brochure" | "project_start" | "stage" | "other";

type Attachment = { filename: string; path: string };

type SendInput = {
  kind: MailKind;
  to: string;
  subject: string;
  html: string;
  inquiryId?: string;
  projectId?: string;
  /** Resend 가 path 를 직접 받아 붙인다 — 10MB 를 base64 로 실어 보내지 않는다 */
  attachments?: Attachment[];
};

export async function sendMail({
  kind,
  to,
  subject,
  html,
  inquiryId,
  projectId,
  attachments,
}: SendInput): Promise<{ ok: boolean; skipped: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  const admin = createAdminClient();

  const log = async (status: "sent" | "failed" | "skipped", error?: string) => {
    await admin.from("email_log").insert({
      kind,
      to_email: to,
      subject,
      inquiry_id: inquiryId ?? null,
      project_id: projectId ?? null,
      status,
      error: error ?? null,
    });
  };

  if (!key) {
    await log("skipped", "RESEND_API_KEY 미설정");
    return { ok: false, skipped: true, error: "발송 키가 아직 설정되지 않았습니다." };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [to],
        reply_to: REPLY_TO,
        subject,
        html,
        ...(attachments?.length ? { attachments } : {}),
      }),
    });

    if (!res.ok) {
      const error = `${res.status} ${await res.text()}`.slice(0, 400);
      await log("failed", error);
      return { ok: false, skipped: false, error };
    }

    await log("sent");
    return { ok: true, skipped: false };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    await log("failed", error);
    return { ok: false, skipped: false, error };
  }
}

/** 메일 공통 껍데기 — 본문만 갈아 끼운다 */
export function mailShell(body: string) {
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Pretendard',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#030303;line-height:1.8">
${body}
<p style="font-size:12px;color:#8a8a8a;margin:32px 0 0;border-top:1px solid #e6e6e6;padding-top:16px">
  ${SERVICE.name} · 주식회사 해그로시 · contact@h-grs.com<br>
  <a href="${SERVICE.url}" style="color:#8a8a8a">${SERVICE.url.replace("https://", "")}</a>
</p>
</div>`;
}

/** 소개서 파일 — `npm run deck` 이 만들어 public/ 에 둔다 */
export const BROCHURE = {
  file: "hgrs-shortform-studio-brochure.pdf",
  filename: "해그로시_숏폼_스튜디오_소개서.pdf",
} as const;

/**
 * 첨부·메일 본문이 거는 소개서 주소.
 *
 * `SERVICE.url` 은 로컬에서 localhost 가 된다. 메일은 **밖에서 열리는 문서**라
 * localhost 주소가 실리면 첨부는 422 로 거절되고 링크는 죽는다 —
 * 그래서 여기서는 공개 도메인으로 고정한다.
 */
const PUBLIC_ORIGIN = SERVICE.url.includes("localhost")
  ? "https://shortform.hgrs.io"
  : SERVICE.url;

export const brochureUrl = `${PUBLIC_ORIGIN}/${BROCHURE.file}`;

/**
 * ① 소개서 발송 — 어드민이 신청 건에서 [소개서 발송]을 누를 때.
 *
 * 본문은 **사장님이 직접 쓴 문안**이다. 임의로 줄이거나 다듬지 않는다.
 * PDF 는 첨부와 링크를 함께 건다 — 첨부를 막아 둔 메일 환경이 적지 않다.
 */
export function brochureMail(inquiry: BrochureInquiry) {
  const name = inquiry.company_name
    ? `${inquiry.company_name} ${inquiry.contact_name}님`
    : `${inquiry.contact_name}님`;

  const para = (t: string) =>
    `<p style="font-size:14px;line-height:1.9;margin:0 0 16px">${t}</p>`;

  return {
    subject: `[${SERVICE.name}] ${name}께 드리는 소개서입니다`,
    html: mailShell(`
<p style="font-size:16px;font-weight:700;line-height:1.6;margin:0 0 20px">매출 높이는 구매전환형 숏폼부터<br>인플루언서 시딩 바이럴까지 한번에!<br>해그로시 숏폼 스튜디오를 소개합니다.</p>

${para(
  "인플루언서 시딩과 매출용 구매전환형 숏폼 소재. 마케팅 익숙하게 하는 팀은 당연히 2차 활용 소스컷들을 확보해서 브랜드 매출의 연속성을 만듭니다.",
)}
${para(
  "혹시 아직도 유행하는 인플루언서 바이럴 배포만 하고 단기적인 트래픽만 보고 계시진 않나요?",
)}

<img src="${PUBLIC_ORIGIN}/deck/mail-hero.jpg" alt="해그로시 촬영 현장" width="512" style="width:100%;max-width:512px;border-radius:12px;display:block;margin:4px 0 20px">

${para(
  "해그로시에서는 컨텐츠 가이드라인과 영상 소스 확보, 챔피언성 광고 숏폼 기획제작 시스템을 하나로 해결해 드립니다. 브랜드 담당자 분은 플랜 신청 후 ‘내 프로젝트’에서 진행 현황을 보고 한두 번 필요한 피드백만 전달하시면 됩니다.",
)}
${para(
  "AI 숏폼은 성과가 안 나오는 게 확인됐고, 비싼 모델 영상은 가성비가 안 좋은 걸 알았습니다. 이제 AI도 소스컷도 매출 만드는 기획제작력도 모두 합리적인 실력으로 확인하세요.",
)}

<table style="width:100%;border-collapse:collapse;background:#f7f5f3;border-radius:12px;margin:24px 0 20px">
  <tr><td style="padding:20px 22px">
    <p style="font-size:15px;font-weight:700;margin:0 0 6px">1분 숏폼 소개서</p>
    <p style="font-size:13px;color:#5c5c5c;line-height:1.8;margin:0">
      법인 소개 · 진행 프로세스 · 플랜 안내 · 계약 절차까지 한 부에 담았습니다.<br>
      <strong style="color:#030303">이 메일에 PDF로 첨부</strong>해 두었고, 아래 버튼으로도 바로 보실 수 있습니다.
    </p>
  </td></tr>
</table>

<p style="margin:0 0 8px">
  <a href="${brochureUrl}" style="display:inline-block;background:#030303;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-size:14px;font-weight:700">
    1분 숏폼 소개서 보기 (PDF)
  </a>
</p>
<p style="font-size:13px;color:#5c5c5c;margin:16px 0 0;line-height:1.9">
  플랜 신청과 ‘내 프로젝트’는 아래 주소에서 이용하실 수 있습니다.
</p>
<p style="font-size:15px;font-weight:700;margin:10px 0 0">
  <a href="${PUBLIC_ORIGIN}" style="color:#030303">${PUBLIC_ORIGIN.replace("https://", "")}</a>
</p>
<p style="font-size:13px;color:#5c5c5c;margin:16px 0 0;line-height:1.8">
  브랜드 상황에 맞는 구성이 궁금하시면 이 메일에 그대로 답장해 주세요.
</p>`),
  };
}

/** ② 프로젝트 시작 안내 — 어드민이 [적용 시작]을 누른 직후 */
export function projectStartMail(name: string, planLabel: string) {
  return {
    subject: `[${SERVICE.name}] 해그로시 숏폼 프로젝트가 시작되었습니다`,
    html: mailShell(`
<h2 style="font-size:20px;margin:0 0 16px">해그로시 숏폼 프로젝트가 시작되었습니다.</h2>
<p style="font-size:14px;margin:0 0 16px">
  ${name}님, <strong>${planLabel}</strong> 진행이 시작되었습니다.<br>
  내 프로젝트에서 인플루언서 시딩과 숏폼 기획제작의 진행 단계를 확인하실 수 있습니다.
</p>
<p style="font-size:14px;margin:0 0 24px">
  먼저 <strong>컨텐츠 가이드라인</strong>을 작성해 주세요. 기획제작 요청 확정까지
  <strong>7일</strong>이 소요됩니다.
</p>
<p style="margin:0">
  <a href="${SERVICE.url}/app" style="display:inline-block;background:#030303;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-size:14px;font-weight:700">
    내 프로젝트 확인하기
  </a>
</p>
<p style="font-size:13px;color:#5c5c5c;margin:16px 0 0">
  ${SERVICE.url}/app
</p>`),
  };
}
