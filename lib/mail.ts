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
 * 발신 주소는 ceo@h-grs.com 고정 — 회신이 사장님에게 바로 가야 한다.
 * (Resend에서 h-grs.com 도메인 인증이 끝나야 실제로 나간다)
 */
const FROM = process.env.NOTIFY_FROM_EMAIL || "해그로시 숏폼 스튜디오 <ceo@h-grs.com>";
const REPLY_TO = "ceo@h-grs.com";

export type MailKind = "brochure" | "project_start" | "stage" | "other";

type SendInput = {
  kind: MailKind;
  to: string;
  subject: string;
  html: string;
  inquiryId?: string;
  projectId?: string;
};

export async function sendMail({
  kind,
  to,
  subject,
  html,
  inquiryId,
  projectId,
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
  ${SERVICE.name} · 주식회사 해그로시<br>
  <a href="${SERVICE.url}" style="color:#8a8a8a">${SERVICE.url.replace("https://", "")}</a>
</p>
</div>`;
}

/**
 * ① 소개서 발송 — 어드민이 신청 건에서 [소개서 발송]을 누를 때.
 *
 * 본문은 짧게 두고 **PDF 소개서**로 넘긴다. 회사·서비스·플랜·프로세스·계약 절차가
 * 전부 그 문서 한 부에 들어 있다(`npm run deck` 으로 만든다).
 * 메일 본문에 표를 다시 그리면 두 곳의 숫자가 언젠가 갈린다.
 */
export function brochureMail(inquiry: BrochureInquiry) {
  const name = inquiry.company_name
    ? `${inquiry.company_name} ${inquiry.contact_name}님`
    : `${inquiry.contact_name}님`;

  return {
    subject: `[${SERVICE.name}] ${name}께 드리는 소개서입니다`,
    html: mailShell(`
<h2 style="font-size:20px;margin:0 0 16px">${name}, 안녕하세요.</h2>
<p style="font-size:14px;margin:0 0 20px;line-height:1.8">
  ${SERVICE.name}에 신청해 주셔서 감사합니다.<br>
  회사 소개와 서비스 진행 방식, 플랜별 금액, 계약·결제 절차까지 정리한 소개서를
  보내드립니다.
</p>

<table style="width:100%;border-collapse:collapse;background:#f7f7f5;border-radius:12px;margin:0 0 20px">
  <tr><td style="padding:20px 22px">
    <p style="font-size:12px;color:#8a8a8a;margin:0 0 8px">소개서에 담긴 내용</p>
    <p style="font-size:13px;color:#5c5c5c;line-height:1.9;margin:0">
      회사 개요 · 클라이언트 및 성장 사례<br>
      서비스 진행 흐름 6단계 · 제작 시스템과 팀 구성<br>
      위너 숏폼 포트폴리오<br>
      <strong style="color:#030303">플랜 및 금액 (싱글 · 패키지 · 시딩 단가)</strong><br>
      진행 단계 · 계약 및 결제 절차 · 진행 조건
    </p>
  </td></tr>
</table>

<p style="margin:0">
  <a href="${SERVICE.url}/${BROCHURE_FILE}" style="display:inline-block;background:#030303;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-size:14px;font-weight:700">
    소개서 내려받기 (PDF)
  </a>
</p>
<p style="font-size:13px;color:#5c5c5c;margin:16px 0 0;line-height:1.8">
  브랜드 상황에 맞는 구성이 궁금하시면 이 메일에 그대로 답장해 주세요.<br>
  ${SERVICE.url.replace("https://", "")} 에서 바로 시작하실 수도 있습니다.
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
