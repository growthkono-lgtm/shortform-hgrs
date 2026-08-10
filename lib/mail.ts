import { createAdminClient } from "@/lib/supabase/server";
import { SERVICE } from "@/lib/constants";
import {
  buildBrochure,
  type BrochureInquiry,
  type BrochureRow,
} from "@/lib/brochure";

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

/** 메일 안의 플랜 표 — 클라이언트마다 CSS 지원이 달라 인라인 스타일 테이블로만 쓴다 */
function planTable(caption: string, tagline: string, rows: BrochureRow[]) {
  const tr = (r: BrochureRow) => `
<tr>
  <td style="padding:10px 8px 10px 0;border-bottom:1px solid #efefef;font-size:13px;font-weight:700;white-space:nowrap">${r.label}</td>
  <td style="padding:10px 8px;border-bottom:1px solid #efefef;font-size:12px;color:#8a8a8a">${r.composition}</td>
  <td style="padding:10px 0 10px 8px;border-bottom:1px solid #efefef;font-size:13px;font-weight:700;text-align:right;white-space:nowrap">${r.price}${
    r.perUnit
      ? `<br><span style="font-size:11px;font-weight:400;color:#8a8a8a">${r.perUnit}</span>`
      : ""
  }</td>
</tr>`;

  return `
<p style="font-size:15px;font-weight:700;margin:28px 0 4px">${caption}</p>
<p style="font-size:12px;color:#8a8a8a;margin:0 0 8px;line-height:1.7">${tagline}</p>
<table style="width:100%;border-collapse:collapse">${rows.map(tr).join("")}</table>`;
}

/**
 * ① 소개서(플랜 안내) — 어드민이 신청 건에서 [소개서 발송]을 누를 때.
 *
 * 랜딩에서 가격을 내렸으니 **이 메일이 가격을 말하는 유일한 자리**다.
 * "정리해서 보내드리겠습니다" 같은 예고편을 보내면 안 된다 — 받는 순간 판단이 되게
 * 권장 구성과 전체 표를 본문에 그대로 싣고, 자세한 건 소개서 페이지로 넘긴다.
 */
export function brochureMail(inquiry: BrochureInquiry) {
  const b = buildBrochure(inquiry, SERVICE.url);

  const recommendation =
    b.result && b.price
      ? `
<table style="width:100%;border-collapse:collapse;background:#f7f7f5;border-radius:12px;margin:0 0 8px">
  <tr>
    <td style="padding:20px 22px">
      <p style="font-size:12px;color:#8a8a8a;margin:0 0 6px">남겨주신 진단 기준 권장 구성</p>
      <p style="font-size:18px;font-weight:700;margin:0">${b.result.plan.label}</p>
      <p style="font-size:12px;color:#8a8a8a;margin:4px 0 12px">${b.result.plan.composition}</p>
      <p style="font-size:22px;font-weight:700;margin:0">${b.price}</p>
    </td>
  </tr>
</table>
${b.result.blurbs
  .map(
    (t) =>
      `<p style="font-size:13px;color:#5c5c5c;line-height:1.8;margin:12px 0 0">${t}</p>`,
  )
  .join("")}`
      : `<p style="font-size:14px;margin:0 0 16px">브랜드에 맞는 구성을 고르실 수 있도록 전체 플랜을 정리해 보내드립니다.</p>`;

  return {
    subject: `[${SERVICE.name}] ${b.greeting}께 드리는 플랜 안내`,
    html: mailShell(`
<h2 style="font-size:20px;margin:0 0 16px">${b.greeting}, 안녕하세요.</h2>
<p style="font-size:14px;margin:0 0 20px;line-height:1.8">
  ${SERVICE.name}에 신청해 주셔서 감사합니다.<br>
  남겨주신 진단 답변을 기준으로 지금 필요한 구성과 금액을 정리했습니다.
</p>

${recommendation}

${planTable("싱글 · 숏폼 기획제작", "브랜드가 보유한 소스로 바로 시작합니다", b.singles)}
${planTable("패키지 · 숏폼 + 인플루언서 시딩", "소스컷 확보부터 함께 진행합니다", b.packages)}

<p style="font-size:12px;color:#8a8a8a;line-height:1.9;margin:20px 0 0">
  ${b.policies.map((p) => `· ${p}`).join("<br>")}
</p>

<p style="margin:28px 0 0">
  <a href="${b.url}" style="display:inline-block;background:#030303;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-size:14px;font-weight:700">
    플랜 안내 전체 보기
  </a>
</p>
<p style="font-size:13px;color:#5c5c5c;margin:16px 0 0;line-height:1.8">
  진행 단계와 조건까지 정리된 안내는 위 버튼에서 보실 수 있습니다.<br>
  회신이 필요하시면 이 메일에 그대로 답장해 주세요.
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
