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
  ${SERVICE.name} · 주식회사 해그로시<br>
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
 * 인사말은 **대표 디렉터가 직접 쓴 문안**이다. 임의로 줄이거나 다듬지 않는다.
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
<p style="font-size:15px;font-weight:700;margin:0 0 20px">안녕하세요. 해그로시 대표 디렉터 송건호입니다.</p>

${para(
  "해그로시는 브랜드 전략과 그로스 마케팅 및 광고 컨텐츠 에이전시로서의 역할을 수행함과 동시에 유튜브 영상 프로덕션의 프로젝트를 동시 수행한 기간제 프로젝트 집단입니다.",
)}
${para(
  "해그로시 숏폼 스튜디오는 기존의 숏폼 시장이 단순 납품, 단순 AI, 마케팅 이해가 없는 영상 기획, 영상 서사가 없는 저감도들의 현상을 바로잡기 위해 탄생했습니다. 클라이언트 여러분들에게 숏폼과 퍼포먼스마케팅 광고 크리에이티브가 본질적으로 유행하고 효과를 보기 시작하던 2018년경 때부터 꾸준히 그 업을 해 온 전문가 집단을 붙여 드립니다.",
)}
${para(
  "우리는 세일즈, 매출, 전환율에 대한 이해를 기반으로 숏폼을 기획하고 제작하며, 인플루언서 시딩 시 필요로 하는 컨텐츠 가이드라인과 소스 컷 확보 등의 번거로운 작업을 모두 대신합니다.",
)}
${para(
  "이제 챔피언성 소재 몇 종으로 매출이 스케일업되고, 광고 운영이 쉬워지고, 인플루언서 및 영상 소스 시딩의 어려움을 모두 해결하세요. 플랜 신청 후 내 프로젝트 대시보드를 통해 진행 단계를 확인하고 피드백을 일괄로 빠르게 반영시키며 결과물을 효과적으로 확보하실 수 있습니다.",
)}

<table style="width:100%;border-collapse:collapse;background:#f7f5f3;border-radius:12px;margin:24px 0 20px">
  <tr><td style="padding:20px 22px">
    <p style="font-size:12px;color:#8a8a8a;margin:0 0 8px">첨부된 소개서에 담긴 내용</p>
    <p style="font-size:13px;color:#5c5c5c;line-height:1.9;margin:0">
      왜 시딩과 숏폼을 하나의 라인으로 묶는가<br>
      회사 개요 · 클라이언트 · 성장 사례<br>
      서비스 진행 흐름 · 제작 시스템과 팀 구성<br>
      <strong style="color:#030303">플랜 및 금액 (싱글 · 패키지 · 시딩 단가)</strong><br>
      진행 단계 · 계약 및 결제 절차 · 진행 조건
    </p>
  </td></tr>
</table>

<p style="margin:0 0 8px">
  <a href="${brochureUrl}" style="display:inline-block;background:#030303;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-size:14px;font-weight:700">
    소개서 내려받기 (PDF)
  </a>
</p>
<p style="font-size:13px;color:#5c5c5c;margin:16px 0 0;line-height:1.9">
  메일에 소개서 파일도 함께 첨부해 두었습니다.<br>
  플랜 신청과 내 프로젝트 대시보드는 아래 주소에서 이용하실 수 있습니다.
</p>
<p style="font-size:15px;font-weight:700;margin:12px 0 0">
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
