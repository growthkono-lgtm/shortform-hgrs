import { createAdminClient } from "@/lib/supabase/server";
import { SERVICE } from "@/lib/constants";
/** 소개서를 보낼 신청 건 — 인사말에 쓰는 이름만 필요하다 */
export type BrochureInquiry = {
  contact_name: string;
  company_name: string | null;
};

/** `npm run deck` 이 만들어 public/ 에 두는 소개서 파일명 */
/** `npm run deck` 이 만들어 public/ 에 두는 소개서 파일명 (숏폼+브랜드SNS 종합) */
const BROCHURE_FILE = "hgrs-studio-brochure.pdf";

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
 * 발신은 **Resend에서 인증된 도메인**이어야 해서 지금은 hgrs.io 를 쓴다.
 * 다만 **@hgrs.io 로 오는 메일을 받을 수신함은 없다** — 회신은 반드시
 * contact@h-grs.com 으로 모은다(REPLY_TO). h-grs.com 을 Resend에 인증하면
 * NOTIFY_FROM_EMAIL 만 바꿔 발신 주소도 옮길 수 있다.
 */
/**
 * 표시 이름에 괄호나 @ 가 들어가면 **반드시 따옴표로 감싼다.**
 * RFC 5322 에서 따옴표 없는 괄호는 주석, @ 는 특수문자다 — SES 가 거절한다.
 * (한 번 당했다: `해그로시 스튜디오 (contact@h-grs.com) <...>` 로 넣었다가 발송 실패)
 */
const FROM =
  process.env.NOTIFY_FROM_EMAIL ||
  `"해그로시 스튜디오" <contact@hgrs.io>`;
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
    return {
      ok: false,
      skipped: true,
      error: "발송 키가 아직 설정되지 않았습니다.",
    };
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

      /**
       * 첨부가 붙은 메일이 실패하면 **링크만으로 한 번 더 보낸다.**
       * 소개서 PDF 가 12MB 라 용량·타임아웃으로 거절될 여지가 있는데,
       * 그렇다고 메일이 아예 안 가면 문의한 사람은 아무것도 못 받는다.
       * 본문에 소개서 링크가 이미 들어 있어서 링크만으로도 쓸모가 있다.
       */
      if (attachments?.length) {
        const retry = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ from: FROM, to: [to], reply_to: REPLY_TO, subject, html }),
        });
        if (retry.ok) {
          await log("sent", `첨부 실패로 링크만 재발송: ${error}`);
          return { ok: true, skipped: false };
        }
      }

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
  file: "hgrs-studio-brochure.pdf",
  filename: "해그로시_스튜디오_종합소개서.pdf",
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
  const para = (t: string) =>
    `<p style="font-size:14px;line-height:1.9;margin:0 0 16px">${t}</p>`;

  /** 세 갈래 선택지 — 문의한 사람이 자기 상황을 고르게 만든다 */
  const choice = (title: string, desc: string, href: string) =>
    `<tr><td style="padding:0 0 10px">
  <a href="${href}" style="display:block;background:#f7f5f3;border-radius:12px;padding:16px 18px;text-decoration:none">
    <span style="display:block;font-size:14px;font-weight:700;color:#030303">${title}</span>
    <span style="display:block;font-size:13px;color:#5c5c5c;line-height:1.7;margin-top:4px">${desc}</span>
  </a>
</td></tr>`;

  return {
    subject: `[${SERVICE.name}] 프로젝트 소개서를 전달 드립니다.`,
    html: mailShell(`
<p style="font-size:16px;font-weight:700;line-height:1.65;margin:0 0 20px">요즘 브랜드는 컨텐츠에서 시작해<br>고객으로 전환시키는 그로스 퍼널로 끝납니다.</p>

${para(
  "해그로시는 <strong>종합 마케팅과 브랜드 컨텐츠 덕션을 함께 운영하는 스튜디오</strong>입니다. 브랜드 유튜브·인스타그램 등 SNS 채널과, 인플루언서 시딩 바이럴 그리고 그 소스의 2차 활용을 통한 구매 전환형 숏폼 기획제작을 함께 진행합니다.",
)}

<img src="${PUBLIC_ORIGIN}/deck/mail-hero.jpg" alt="해그로시 촬영 현장" width="512" style="width:100%;max-width:512px;border-radius:12px;display:block;margin:4px 0 20px">

${para(
  "필요하시면 브랜드 이벤트와 프로모션, CRM까지 병행해 비즈니스의 스케일과 포지션을 함께 만들어 갑니다. 채널 하나를 맡기시든, 브랜드 전체를 함께 굴리시든 같은 팀이 붙습니다.",
)}

<p style="font-size:15px;font-weight:700;margin:24px 0 12px">지금 어느 쪽이 필요하신가요?</p>
<table style="width:100%;border-collapse:collapse;margin:0 0 20px">
${choice(
  "매출 스케일업 구매 전환형 숏폼",
  "인플루언서 시딩과 2차 활용 소스로 광고 소재를 편수 단위로",
  `${PUBLIC_ORIGIN}/shortform`,
)}
${choice(
  "브랜드 SNS 채널 컨텐츠 활성화",
  "유튜브·인스타그램 채널의 기획·전략·운영을 연 단위로",
  `${PUBLIC_ORIGIN}/sns-brand`,
)}
${choice(
  "종합 브랜드 마케팅 전개",
  "채널·컨텐츠·광고에 이벤트·프로모션·CRM 까지 하나의 전략으로",
  `${PUBLIC_ORIGIN}/portfolio`,
)}
</table>

<table style="width:100%;border-collapse:collapse;background:#f7f5f3;border-radius:12px;margin:0 0 20px">
  <tr><td style="padding:20px 22px">
    <p style="font-size:15px;font-weight:700;margin:0 0 6px">해그로시 스튜디오 종합 소개서</p>
    <p style="font-size:13px;color:#5c5c5c;line-height:1.8;margin:0">
      법인 소개 · 세 서비스 라인 · 성과 사례 · 진행 프로세스 · 플랜과 계약 절차까지 한 부에 담았습니다.<br>
      <strong style="color:#030303">이 메일에 PDF로 첨부</strong>해 두었고, 아래 버튼으로도 바로 보실 수 있습니다.
    </p>
  </td></tr>
</table>

<p style="margin:0 0 8px">
  <a href="${brochureUrl}" style="display:inline-block;background:#030303;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-size:14px;font-weight:700">
    종합 소개서 보기 (PDF)
  </a>
</p>
<p style="font-size:13px;color:#5c5c5c;margin:16px 0 0;line-height:1.9">
  브랜드 상황에 맞는 구성이 궁금하시면 <strong style="color:#030303">이 메일에 그대로 답장</strong>해 주세요.<br>
  채널 현황과 목표를 보내주시면 필요한 작업 범위를 정리해 회신드립니다.
</p>
<p style="font-size:15px;font-weight:700;margin:14px 0 0">
  <a href="${PUBLIC_ORIGIN}" style="color:#030303">${PUBLIC_ORIGIN.replace("https://", "")}</a>
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
