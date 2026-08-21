import { createAdminClient } from "@/lib/supabase/server";
import { SERVICE } from "@/lib/constants";
import {
  KAKAO_CHANNEL,
  MEETING_BOOKING_URL,
  PLANS,
  SUBSCRIPTION_MONTHLY,
  type PlanCode,
} from "@/lib/constants";

/** 소개서를 보낼 신청 건 — 인사말에 쓰는 이름만 필요하다 */
export type BrochureInquiry = {
  contact_name: string;
  company_name: string | null;
};

/** `npm run deck` 이 만들어 public/ 에 두는 소개서 파일명 */
/** `npm run deck` 이 만들어 public/ 에 두는 소개서 파일명 (숏폼 + 브랜드 채널 그로스 종합) */

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

/** DB(email_log.kind) 제약과 1:1. 여기 없는 값을 쓰면 적재가 실패한다 */
/**
 * 조용시간 — **KST 20:00 ~ 10:00 에는 메일을 보내지 않는다.**
 *
 * 클라이언트도 작업자도 밤에 업무 알림을 받으면 좋아하지 않는다. 그 시간대에 발생한 메일은
 * 버리지 않고 **다음 오전 10시로 예약**한다(Resend scheduledAt). 우리 서버가 큐를 들고
 * 있을 필요가 없어서, 배포가 재시작돼도 예약은 그대로 남는다.
 *
 * 반환값이 null 이면 "지금 보내도 되는 시간"이다.
 */
const KST_OFFSET = 9 * 60 * 60 * 1000;
const QUIET_FROM = 20; // 20시부터
const QUIET_TO = 10; // 10시까지

export function nextSendableAt(now: Date = new Date()): Date | null {
  const kst = new Date(now.getTime() + KST_OFFSET);
  const hour = kst.getUTCHours();
  if (hour >= QUIET_TO && hour < QUIET_FROM) return null;

  const target = new Date(kst);
  target.setUTCHours(QUIET_TO, 0, 0, 0);
  // 밤 20시 이후면 다음 날 오전 10시, 새벽이면 오늘 오전 10시
  if (hour >= QUIET_FROM) target.setUTCDate(target.getUTCDate() + 1);
  return new Date(target.getTime() - KST_OFFSET);
}

export type MailKind =
  | "brochure"
  | "project_start"
  | "stage"
  | "other"
  | "client_todo"
  | "source_ready"
  | "work_remind"
  | "work_deadline"
  | "preview_ready"
  | "final_ready"
  | "project_done"
  /** 문의가 들어왔을 때 contact@h-grs.com 으로 가는 내부 알림 (2026-08-18) */
  | "inquiry_notice";

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
  /** 같은 메일을 연달아 보내야 할 때만 켠다 — 기본은 2분 중복 차단 */
  allowDuplicate?: boolean;
  /**
   * 답장이 갈 주소. 안 주면 contact@h-grs.com. (2026-08-18)
   *
   * 내부 알림 메일에 쓴다 — 문의가 오면 그 메일의 답장 주소를 **고객 주소**로
   * 박아 두어야 사장님이 받은편지함에서 [답장]만 눌러 바로 회신하신다.
   * 주소를 옮겨 적는 한 단계가 실제로는 회신을 하루 늦춘다.
   */
  replyTo?: string;
};

export async function sendMail({
  kind,
  to,
  subject,
  html,
  inquiryId,
  projectId,
  attachments,
  replyTo,
  allowDuplicate,
}: SendInput): Promise<{
  ok: boolean;
  skipped: boolean;
  /** 2분 중복차단에 걸려 **실제로는 나가지 않았다.** 화면에 그대로 적는다 */
  duplicate?: boolean;
  error?: string;
}> {
  const key = process.env.RESEND_API_KEY;
  const admin = createAdminClient();

  // 조용시간에 걸리면 다음 오전 10시로 미룬다. 소개서 발송처럼 내가 직접 누르는 건 예외로 둔다
  const scheduledAt = kind === "brochure" ? null : nextSendableAt();

  const log = async (
    status: "sent" | "failed" | "skipped" | "scheduled" | "blocked",
    error?: string,
    providerId?: string | null,
  ) => {
    await admin.from("email_log").insert({
      kind,
      to_email: to,
      subject,
      inquiry_id: inquiryId ?? null,
      project_id: projectId ?? null,
      status,
      error: error ?? null,
      // 이 ID 가 있어야 나중에 "정말 도착했나" 를 Resend 에 물어볼 수 있다
      provider_id: providerId ?? null,
    });
  };

  /**
   * **중복 발송 차단 — 모든 경로 공통.** (2026-08-20)
   *
   * 08-19 에 공개 문의 폼이 22초 동안 7번 접수돼 고객에게 소개서가 7통 나갔다.
   * 그때는 폼 한 곳만 막았는데, **어드민의 [소개서 보내기]·[브랜드에게 알리기]
   * 버튼 세 곳은 여전히 두 번 누르면 두 번 나간다.** 화면마다 잠금을 다는 대신
   * 모든 발송이 지나는 여기 한 곳에서 막는다.
   *
   * 기준은 **같은 kind + 같은 수신자 + 같은 제목이 2분 안에** 이미 나갔는가.
   * 2분이면 더블클릭·새로고침·네트워크 재시도를 덮고, 정말 다시 보내야 하는
   * 경우(내용을 고쳐 재발송)는 제목이 다르거나 2분이 지나 있다.
   * 일부러 같은 메일을 연달아 보내야 하면 `allowDuplicate` 로 푼다.
   *
   * ── 2026-08-21 고침 ────────────────────────────────────────────────
   * 예전에는 여기서 **조용히 성공을 돌려주고 아무 기록도 남기지 않았다.**
   * 그래서 [소개서 재발송]을 눌러 "발송했습니다" 를 봐도 실제로는 안 나간
   * 경우가 생겼고, 그걸 구분할 방법이 화면에 없었다. 이제 `blocked` 로
   * 이력을 남기고 호출한 쪽에 `duplicate` 를 알려 준다 —
   * **화면에 "안 나갔다" 고 그대로 적기 위해서다.**
   */
  if (!allowDuplicate) {
    const since = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const { data: dup } = await admin
      .from("email_log")
      .select("id")
      .eq("kind", kind)
      .eq("to_email", to)
      .eq("subject", subject)
      .in("status", ["sent", "scheduled"])
      .gte("created_at", since)
      .limit(1);
    if (dup?.length) {
      await log("blocked", "2분 안에 같은 메일이 이미 나가 보내지 않음");
      return { ok: true, skipped: true, duplicate: true };
    }
  }

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
        reply_to: replyTo ?? REPLY_TO,
        subject,
        html,
        ...(attachments?.length ? { attachments } : {}),
        ...(scheduledAt ? { scheduled_at: scheduledAt.toISOString() } : {}),
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
          body: JSON.stringify({ from: FROM, to: [to], reply_to: replyTo ?? REPLY_TO, subject, html }),
        });
        if (retry.ok) {
          const retryId = await retry
            .json()
            .then((b: { id?: string }) => b?.id ?? null)
            .catch(() => null);
          await log("sent", `첨부 실패로 링크만 재발송: ${error}`, retryId);
          return { ok: true, skipped: false };
        }
      }

      await log("failed", error);
      return { ok: false, skipped: false, error };
    }

    /**
     * Resend 가 돌려주는 메일 ID 를 반드시 챙긴다. (2026-08-21)
     * 이게 없으면 나중에 "그 메일 정말 도착했나" 를 물어볼 열쇠가 없다.
     * 응답 본문이 깨져도 발송 자체는 성공이므로 여기서 던지지 않는다.
     */
    const providerId = await res
      .json()
      .then((b: { id?: string }) => b?.id ?? null)
      .catch(() => null);

    if (scheduledAt) {
      await log(
        "scheduled",
        `조용시간(20~10시)이라 ${scheduledAt.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} 발송 예약`,
        providerId,
      );
      return { ok: true, skipped: false };
    }
    await log("sent", undefined, providerId);
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
  ? "https://hgrs.io" // 2026-08-20: 루트 도메인 이전 후에도 옛 서브도메인이 남아 있었다
  : SERVICE.url;

export const brochureUrl = `${PUBLIC_ORIGIN}/${BROCHURE.file}`;

/**
 * ① 소개서 발송 — 문의가 들어오면 자동으로, 어드민에서 [소개서 재발송]으로도.
 *
 * ── 2026-08-21 전면 개편 ───────────────────────────────────────────────
 * 사장님이 실제 회신하시던 메일을 그대로 옮겼다. *"내가 방금 답변하다보니까
 * … 이런 식으로 답장하게 되더라."* 손으로 매번 쓰시던 것이 곧 정답이라,
 * 그 문안을 이 메일이 대신 쓰게 한다.
 *
 * 담은 것 — 상담 두 경로(카톡·구글밋) / **플랜별 포함 범위와 단가** /
 * 소개서의 실적 증빙·30여 브랜드 포트폴리오 안내 / 진행 방식(R&R).
 *
 * ⚠️ **광고 집행·운영 이야기는 한 줄도 넣지 않는다.** (사장님 명시)
 *    챔피언 소재 디벨롭·월 예산 기준·주단위 리포팅 전부 제외.
 * ⚠️ **발신자는 개인명이 아니라 "PM팀"** 이다. 자동 발송이라 특정인 이름을
 *    박으면 그 사람이 직접 쓴 메일처럼 읽힌다.
 * ⚠️ 금액은 반드시 `PLANS` 에서 파생한다. 문안에 숫자를 손으로 적으면
 *    가격이 두 벌이 되고, 메일에 적힌 값과 실제 청구액이 갈린다.
 */
function planPrice(code: PlanCode, tier: string): string {
  const row = PLANS.find((p) => p.code === code && p.tier === tier);
  return row ? row.betaPrice.toLocaleString("ko-KR") : "";
}

export function brochureMail(_inquiry: BrochureInquiry) {
  const para = (t: string) =>
    `<p style="font-size:14px;line-height:1.9;margin:0 0 16px">${t}</p>`;

  /** 플랜 한 칸 — 이름 · 금액 · 포함 범위 */
  const plan = (name: string, price: string, lead: string, items: string) => `
<table role="presentation" width="100%" style="width:100%;border-collapse:collapse;margin:0 0 10px;background:#f7f5f3;border-radius:12px">
  <tr><td style="padding:16px 18px">
    <p style="font-size:15px;font-weight:700;line-height:1.5;margin:0 0 4px">${name}</p>
    <p style="font-size:15px;font-weight:800;color:#030303;line-height:1.5;margin:0 0 8px">${price}</p>
    <p style="font-size:13px;color:#5c5c5c;line-height:1.75;margin:0">${lead}<br>${items}</p>
  </td></tr>
</table>`;

  /**
   * 미팅 잡는 법 — 예약 링크가 있으면 **버튼 한 번**, 없으면 슬롯을 받는다.
   * 링크를 아직 안 만들었는데 버튼만 있으면 누른 사람이 막다른 곳에 닿는다.
   */
  const meeting = MEETING_BOOKING_URL
    ? `<a href="${MEETING_BOOKING_URL}" style="display:inline-block;background:#191600;color:#fee500;text-decoration:none;padding:11px 22px;border-radius:999px;font-size:14px;font-weight:700;margin:0 0 4px">
      미팅 시간 고르기
    </a>
    <p style="font-size:12px;color:#5b5400;line-height:1.7;margin:8px 0 0">
      원하시는 시간을 고르시면 <strong>구글 미팅 링크가 바로 발급</strong>됩니다.
    </p>`
    : `<p style="font-size:13px;color:#3b3600;line-height:1.8;margin:0">
      편하신 <strong>일정 슬롯을 두세 개</strong> 회신해 주시면 맞춰서 미팅 링크를 보내 드립니다.<br>
      <span style="color:#5b5400">(예: 차주 월·화 오후 1시~4시)</span>
    </p>`;

  return {
    subject: `[${SERVICE.name}] 프로젝트 소개서를 전달 드립니다.`,
    html: mailShell(`
<p style="font-size:16px;font-weight:700;line-height:1.65;margin:0 0 14px">요즘 브랜드는 컨텐츠에서 시작해<br>고객으로 전환시키는 그로스 퍼널로 끝납니다.</p>

${para(
  `안녕하세요. <strong>${SERVICE.name} PM팀</strong>입니다.<br>
   요청하신 <strong>종합 소개서</strong>를 전달 드립니다. 궁금한 점은 이 메일에 그대로 답장 주시거나, 아래 카카오톡으로 편하게 말씀 주세요.`,
)}

<!-- 상담 배너 — 기다리게 하는 문장 대신 **지금 잡을 수 있는 자리**를 준다.
     08-21 에 경로를 둘로 명시했다. 카톡은 즉시, 화상은 일정 조율. -->
<table role="presentation" width="100%" style="width:100%;border-collapse:collapse;background:#fee500;border-radius:12px;margin:0 0 22px">
  <tr><td style="padding:20px 22px">
    <p style="font-size:16px;font-weight:700;color:#191600;margin:0 0 14px">상담은 두 가지로 진행합니다</p>

    <p style="font-size:14px;font-weight:700;color:#191600;margin:0 0 6px">1. 카카오톡 실시간 상담 — 지금 바로 가능합니다</p>
    <a href="${KAKAO_CHANNEL.chatUrl}" style="display:inline-block;background:#191600;color:#fee500;text-decoration:none;padding:11px 22px;border-radius:999px;font-size:14px;font-weight:700;margin:0 0 18px">
      카카오톡으로 상담하기
    </a>

    <p style="font-size:14px;font-weight:700;color:#191600;margin:0 0 6px">2. 구글 화상 미팅 — 숏폼 플랜·구독제는 화상 미팅을 우선 진행합니다</p>
    ${meeting}

    <p style="font-size:12px;color:#5b5400;line-height:1.7;margin:14px 0 0;border-top:1px solid rgba(25,22,0,0.15);padding-top:12px">
      따로 요청하지 않으셔도 <strong>영업일 2일 이내</strong>에 안내 연락을 드립니다. 부재 시 문자를 남겨 드립니다.
    </p>
  </td></tr>
</table>

${para(
  "해그로시는 <strong>종합 마케팅과 브랜드 컨텐츠 덕션을 함께 운영하는 스튜디오</strong>입니다. 브랜드 유튜브·인스타그램 등 SNS 채널과, 인플루언서 시딩 바이럴 그리고 그 소스의 2차 활용을 통한 구매 전환형 숏폼 기획제작을 함께 진행합니다.",
)}

<img src="${PUBLIC_ORIGIN}/deck/mail-hero.jpg" alt="해그로시 촬영 현장" width="512" style="width:100%;max-width:512px;border-radius:12px;display:block;margin:4px 0 20px">

<!-- 소개서 카드 — 표지를 함께 띄운다. 첨부 파일 이름만으로는 무엇이 들었는지
     안 보인다. 08-21 에 **실적 증빙을 먼저 보라**는 안내를 넣었다. -->
<table role="presentation" width="100%" style="width:100%;border-collapse:collapse;background:#f7f5f3;border-radius:12px;margin:0 0 14px">
  <tr><td style="padding:20px 22px">
    <p style="font-size:15px;font-weight:700;margin:0 0 6px">해그로시 스튜디오 종합 소개서</p>
    <p style="font-size:13px;color:#5c5c5c;line-height:1.8;margin:0 0 14px">
      <strong style="color:#030303">30여 브랜드 포트폴리오</strong>와 <strong style="color:#030303">실적 증빙</strong>을 담았습니다.
      월별 구매금액·구매건수·ROAS 표와 실제 편성표를 브랜드별 장표에 그대로 실었으니,
      성과 부분을 먼저 확인해 주시면 이야기가 빨라집니다.
    </p>
    <a href="${brochureUrl}">
      <img src="${PUBLIC_ORIGIN}/deck/brochure-cover.jpg" alt="해그로시 스튜디오 종합 소개서 표지" width="512" style="width:100%;max-width:512px;border-radius:8px;border:1px solid #e6e6e6;display:block">
    </a>
  </td></tr>
</table>

<p style="margin:0 0 26px">
  <a href="${brochureUrl}" style="display:inline-block;background:#030303;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-size:14px;font-weight:700">
    종합 소개서 보기 (PDF)
  </a>
</p>

<!-- ── 플랜과 단가 ────────────────────────────────────────────────
     소개서에도 있지만 메일에서 한 번 더 적는다. 사장님이 회신할 때마다
     손으로 쓰시던 부분이고, 첨부를 안 여는 분이 실제로 많다. -->
<p style="font-size:17px;font-weight:800;margin:0 0 10px">플랜과 단가</p>
<p style="font-size:13px;color:#5c5c5c;line-height:1.8;margin:0 0 16px">
  <strong style="color:#030303">기획은 옵션이 아니라 필수 포함입니다.</strong>
  브랜드 소구점 분석과 퍼포먼스 최적화 기획안, 최신 트렌드 레퍼런스 테스트가
  모든 숏폼 플랜에 기본으로 들어갑니다.
</p>

${plan(
  "숏폼 싱글 플랜",
  `10편 기준 ${planPrice("shorts_only", "10")}원`,
  "구매 전환형 숏폼 기획·제작",
  "기획 · 대본 · 콘티 / 편집 · 자막 · 보정 / 트렌드 레퍼런스 테스트 / AI 활용 효율화 / 편당 1회 무상 수정",
)}
${plan(
  "숏폼 멀티 플랜",
  `숏폼 10편 + 인플루언서 시딩 10명 기준 ${planPrice("full", "growth")}원`,
  "소재 확보부터 함께합니다",
  "<strong style=\"color:#030303\">싱글 플랜의 기획·제작 전부</strong> + 인플루언서 시딩 / 콘텐츠 가이드라인 설계 / 회수 소재 광고용 재편집",
)}
${plan(
  "마케팅 팀 구독제",
  `월 ${SUBSCRIPTION_MONTHLY.toLocaleString("ko-KR")}원`,
  "꼭 필요한 우선순위 전략만 조합해 팀 단위로 투입합니다",
  "<strong style=\"color:#030303\">업무 범위에 따라 부분 가감 협의 가능합니다.</strong>",
)}
${plan(
  "SNS 채널 운영",
  "6개월 또는 1년 단위 별도 진행",
  "브랜드가 가진 채널을 실제로 도는 채널로 만듭니다",
  "유튜브의 경우 <strong style=\"color:#030303\">PD · 촬영 · 기획작가까지 포함하는 스펙</strong>부터, <strong style=\"color:#030303\">쇼츠 · 릴스 미러링 형태</strong>까지 범위를 맞춰 구성합니다.",
)}

<p style="font-size:12px;color:#8a8a8a;margin:0 0 28px">모든 금액 부가세 별도</p>

<!-- ── 진행 방식 ──────────────────────────────────────────────────
     "우리가 뭘 해야 하나" 가 안 보이면 견적서만 받고 멈춘다.
     브랜드가 줄 것을 **네 가지로 못 박아** 문턱을 낮춘다. -->
<p style="font-size:17px;font-weight:800;margin:0 0 14px">진행 방식</p>

<table role="presentation" width="100%" style="width:100%;border-collapse:collapse;margin:0 0 26px">
  <tr><td style="padding:0 0 14px;border-bottom:1px solid #e6e6e6">
    <p style="font-size:12px;color:#8a8a8a;margin:0 0 4px">브랜드에서 주실 것</p>
    <p style="font-size:14px;line-height:1.8;margin:0">
      싱글 플랜 기준 네 가지면 충분합니다 —<br>
      <strong>소스컷 / 목표 / 프로모션·가격 / 예산과 준수해야 할 요청사항</strong>
    </p>
  </td></tr>
  <tr><td style="padding:14px 0;border-bottom:1px solid #e6e6e6">
    <p style="font-size:12px;color:#8a8a8a;margin:0 0 4px">저희가 하는 것</p>
    <p style="font-size:14px;line-height:1.8;margin:0">
      소구점 분석 → 기획안 → 제작.<br>
      진행 단계는 제공해 드리는 <strong>프로젝트 어드민</strong>에서 실시간으로 보실 수 있습니다.
    </p>
  </td></tr>
  <tr><td style="padding:14px 0 0">
    <p style="font-size:12px;color:#8a8a8a;margin:0 0 4px">확인만 해 주시면 됩니다</p>
    <p style="font-size:14px;line-height:1.8;margin:0">
      영상 피드백 → 최종 컨펌. 여기서 끝납니다.
    </p>
  </td></tr>
</table>

<p style="font-size:13px;color:#5c5c5c;margin:0;line-height:1.9">
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

/**
 * 진행 안내 메일 — 어드민이 브랜드에게 직접 보내는 한 통. (2026-08-14)
 *
 * ── 왜 만들었나 ────────────────────────────────────────────────────────
 * 사장님 지시: *"실제 일에선 브랜드가 뭘 물어보고 내가 답변해야 하는 것들이
 * 꽤 있을 거거든. 그런 건 분명 개인 연락 전화 카톡 이런 거 하려고 할 거야.
 * 난 그 리소스도 개선하고 싶어."*
 *
 * 방향은 한 줄이다 — **우리가 먼저 메일로 알린다.** 먼저 알려 두면 브랜드가
 * 전화할 이유가 줄고, 물어볼 게 남으면 채널톡으로 온다. 개인 연락처로 새는
 * 대화를 줄이는 가장 싼 방법은 답을 미리 보내 두는 것이다.
 *
 * 그래서 이 메일에는 **답장할 곳이 명시**돼 있다. 회신하거나 대시보드에서
 * 채널톡을 열면 된다고 매번 같은 자리에 적는다.
 */
export const CLIENT_NOTICE_PRESETS = {
  source: {
    label: "소스 촬영본 요청",
    subject: "소스 촬영본을 기다리고 있습니다",
    lead: "제작을 시작하려면 촬영 원본이 필요합니다. 공유해 주신 소스 폴더에 올려 주시면 바로 편집에 들어갑니다.",
  },
  schedule: {
    label: "일정 안내",
    subject: "이번 회차 일정 안내드립니다",
    lead: "진행 일정을 정리해 알려 드립니다. 아래 내용 확인해 주시고, 조정이 필요하시면 회신 주세요.",
  },
  preview: {
    label: "1차 완성본 올라왔습니다",
    subject: "1차 완성본이 올라왔습니다 — 확인 부탁드립니다",
    lead: "대시보드에서 바로 보시고 수정 요청을 남기실 수 있습니다. 무상 수정은 편당 1회입니다.",
  },
  revised: {
    label: "수정 반영 완료",
    subject: "요청하신 수정을 반영했습니다",
    lead: "말씀하신 부분을 반영해 다시 올렸습니다. 대시보드에서 확인해 주세요.",
  },
  delay: {
    label: "일정 지연 안내",
    subject: "일정이 조정되어 미리 알려 드립니다",
    lead: "예정보다 시간이 더 필요해 먼저 알려 드립니다. 늦어지는 이유와 새 일정은 아래와 같습니다.",
  },
  free: {
    label: "직접 작성",
    subject: "",
    lead: "",
  },
} as const;

export type ClientNoticeKey = keyof typeof CLIENT_NOTICE_PRESETS;

export function clientNoticeMail(input: {
  contactName: string;
  planLabel: string;
  preset: ClientNoticeKey;
  subject?: string;
  body: string;
}) {
  const preset = CLIENT_NOTICE_PRESETS[input.preset];
  const subject =
    (input.subject?.trim() || preset.subject || "진행 안내드립니다") +
    ` · ${input.planLabel}`;

  const html = mailShell(`
    <p style="margin:0 0 6px;font-size:12px;color:#8a8a8a;letter-spacing:0.04em">진행 안내</p>
    <p style="margin:0 0 18px;font-size:19px;font-weight:700;line-height:1.45">
      ${input.contactName} 님, 안녕하세요.
    </p>

    ${preset.lead ? `<p style="margin:0 0 16px;font-size:14px;line-height:1.9;color:#4b5563">${preset.lead}</p>` : ""}

    <div style="margin:0 0 26px;padding:18px 20px;background:#f6f6f4;border-radius:12px;font-size:14px;line-height:1.9;white-space:pre-wrap">${input.body}</div>

    <a href="${SERVICE.url}/app"
       style="display:inline-block;background:#0a0a0c;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-size:14px;font-weight:700">
      대시보드에서 확인하기
    </a>

    <p style="margin:26px 0 0;font-size:12px;line-height:1.8;color:#9ca3af">
      이 메일에 <b>그대로 회신</b>하시면 담당자에게 전달됩니다.<br>
      급하신 건은 대시보드 우측 하단 상담 버튼으로 남겨 주세요 — 저희가 확인하는 대로 답변드립니다.
    </p>
  `);

  return { subject, html };
}

/**
 * 문의가 들어오면 contact@h-grs.com 으로 가는 내부 알림. (2026-08-18)
 *
 * 사장님 지시: *"우리가 소개서 발송하면 어떤 거 선택한 어떤 누구한테 메일이
 * 어떻게 나갔다고 contact@h-grs.com 으로 보내줘. 그래야 내가 거기서 바로
 * 회신하지."*
 *
 * 그래서 이 메일의 핵심은 본문이 아니라 **답장 주소**다. `sendMail` 에
 * `replyTo` 로 문의한 사람의 주소를 넘긴다 — 받은편지함에서 [답장]만 누르면
 * 고객에게 바로 간다. 주소를 옮겨 적는 한 단계가 회신을 하루 늦춘다.
 *
 * 어드민을 열지 않고도 통화가 되게 필요한 것을 다 담는다 — 특히 **무엇을
 * 골랐는지**와 **현황 체크 로그**. "소스가 거의 없다" 고 답한 브랜드와
 * "촬영본이 충분하다" 고 답한 브랜드는 첫 마디가 달라야 한다.
 */
export function inquiryNoticeMail(input: {
  companyName: string;
  contactName: string;
  email: string;
  phone: string | null;
  brandUrl: string | null;
  /** 화면에 보이던 그대로의 문구 (예: "숏폼 — 패키지 플랜") */
  planLabel: string;
  /** "10편" · "해당 없음" · "미선택" — 판정은 describeSelection 이 한다 */
  countLabel: string;
  /** 어느 랜딩에서 왔나 */
  from: string;
  /** 현황 체크 문답. 비어 있으면 "체크 로그 없음" 으로 찍는다 */
  checkLog: { question: string; answer: string }[];
  /** 진단이 추천한 구성 (있을 때만) */
  recommended: string | null;
  message: string | null;
  sentTo: string;
}) {
  const esc = (t: string) =>
    t.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] ?? c);

  const row = (label: string, value: string) =>
    `<tr>
  <td style="padding:6px 14px 6px 0;font-size:12px;color:#8a8a8a;white-space:nowrap;vertical-align:top">${label}</td>
  <td style="padding:6px 0;font-size:14px;color:#030303;line-height:1.6">${value}</td>
</tr>`;

  // 편수가 "해당 없음" 인 플랜에까지 굵게 붙이면 눈이 그쪽으로 끌린다
  const plan =
    input.countLabel === "해당 없음"
      ? esc(input.planLabel)
      : `${esc(input.planLabel)} · <strong>${esc(input.countLabel)}</strong>`;

  const log = input.checkLog.length
    ? `<table style="width:100%;border-collapse:collapse;margin:6px 0 0">
${input.checkLog
  .map(
    (r) => `<tr><td style="padding:7px 0;border-top:1px solid #eee">
  <span style="display:block;font-size:12px;color:#8a8a8a;line-height:1.6">${esc(r.question)}</span>
  <span style="display:block;font-size:13px;color:#030303;font-weight:600;line-height:1.7;margin-top:2px">→ ${esc(r.answer)}</span>
</td></tr>`,
  )
  .join("")}
</table>`
    : `<span style="color:#b45309;font-weight:600">체크 로그 없음</span>`;

  return {
    /**
     * 제목은 짧게, 그러나 **문의만은 눈에 띄게.** (2026-08-21)
     * 나머지 내부 메일은 그러려니 하고 넘겨도 되지만 이건 회신해야 하는 건이다.
     * 플랜 라벨의 "숏폼 — " 같은 접두는 뗀다 — 어차피 우리가 파는 것이다.
     */
    subject: `문의 🔔 ${input.companyName} · ${input.planLabel.replace(/^[^—]*—\s*/, "")}`,
    html: mailShell(`
<p style="margin:0 0 4px;font-size:12px;color:#8a8a8a">새 프로젝트 문의</p>
<p style="margin:0 0 18px;font-size:20px;font-weight:800;line-height:1.4">${esc(input.companyName)}</p>

<div style="background:#f7f5f3;border-radius:12px;padding:16px 18px;margin:0 0 20px">
  <span style="display:block;font-size:12px;color:#8a8a8a">선택한 프로젝트</span>
  <span style="display:block;font-size:15px;font-weight:700;line-height:1.6;margin-top:3px">${plan}</span>
</div>

<table style="width:100%;border-collapse:collapse;margin:0 0 20px">
${row("담당자", esc(input.contactName))}
${row("이메일", `<a href="mailto:${esc(input.email)}" style="color:#030303">${esc(input.email)}</a>`)}
${input.phone ? row("연락처", `<a href="tel:${esc(input.phone)}" style="color:#030303">${esc(input.phone)}</a>`) : ""}
${input.brandUrl ? row("브랜드", `<a href="${esc(input.brandUrl)}" style="color:#030303">${esc(input.brandUrl)}</a>`) : ""}
${row("유입", esc(input.from))}
${input.recommended ? row("추천 구성", esc(input.recommended)) : ""}
</table>

${
  input.message
    ? `<p style="margin:0 0 6px;font-size:12px;color:#8a8a8a">남긴 말</p>
<p style="margin:0 0 20px;background:#f7f5f3;border-radius:12px;padding:14px 16px;font-size:14px;line-height:1.8;white-space:pre-wrap">${esc(input.message)}</p>`
    : ""
}

<p style="margin:0 0 2px;font-size:12px;color:#8a8a8a">현황 체크</p>
${log}

<p style="margin:22px 0 0;padding:14px 16px;background:#f0f4f8;border-radius:12px;font-size:13px;line-height:1.8;color:#4b5563">
  소개서는 <strong>${esc(input.sentTo)}</strong> 로 이미 나갔습니다.<br>
  이 메일에 <strong>[답장]</strong> 하시면 문의한 분께 바로 갑니다.
</p>

<p style="margin:16px 0 0;font-size:12px;color:#9ca3af">
  <a href="${PUBLIC_ORIGIN}/admin" style="color:#9ca3af">어드민에서 열기</a>
</p>
    `),
  };
}
