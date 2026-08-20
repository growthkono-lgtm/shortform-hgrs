import { createAdminClient } from "@/lib/supabase/server";
import { SERVICE } from "@/lib/constants";
import { KAKAO_CHANNEL } from "@/lib/constants";

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
}: SendInput): Promise<{ ok: boolean; skipped: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  const admin = createAdminClient();

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
      // 화면에는 성공으로 돌려준다 — 실제로 이미 나갔기 때문이다
      return { ok: true, skipped: true };
    }
  }

  // 조용시간에 걸리면 다음 오전 10시로 미룬다. 소개서 발송처럼 내가 직접 누르는 건 예외로 둔다
  const scheduledAt = kind === "brochure" ? null : nextSendableAt();

  const log = async (
    status: "sent" | "failed" | "skipped" | "scheduled",
    error?: string,
  ) => {
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
          await log("sent", `첨부 실패로 링크만 재발송: ${error}`);
          return { ok: true, skipped: false };
        }
      }

      await log("failed", error);
      return { ok: false, skipped: false, error };
    }

    if (scheduledAt) {
      await log(
        "scheduled",
        `조용시간(20~10시)이라 ${scheduledAt.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} 발송 예약`,
      );
      return { ok: true, skipped: false };
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
  ? "https://hgrs.io" // 2026-08-20: 루트 도메인 이전 후에도 옛 서브도메인이 남아 있었다
  : SERVICE.url;

export const brochureUrl = `${PUBLIC_ORIGIN}/${BROCHURE.file}`;

/**
 * ① 소개서 발송 — 어드민이 신청 건에서 [소개서 발송]을 누를 때.
 *
 * 본문은 **사장님이 직접 쓴 문안**이다. 임의로 줄이거나 다듬지 않는다.
 * PDF 는 첨부와 링크를 함께 건다 — 첨부를 막아 둔 메일 환경이 적지 않다.
 */
export function brochureMail(_inquiry: BrochureInquiry) {
  const para = (t: string) =>
    `<p style="font-size:14px;line-height:1.9;margin:0 0 16px">${t}</p>`;

  /* 서비스 카드(두 갈래 선택지)는 2026-08-20 에 뺐다 — 소개서에 이미 다 있어
     메일에서 또 늘어놓을 이유가 없다. */

  return {
    subject: `[${SERVICE.name}] 프로젝트 소개서를 전달 드립니다.`,
    html: mailShell(`
<p style="font-size:16px;font-weight:700;line-height:1.65;margin:0 0 20px">요즘 브랜드는 컨텐츠에서 시작해<br>고객으로 전환시키는 그로스 퍼널로 끝납니다.</p>

<!-- 다음에 무슨 일이 일어나는지 먼저 말한다. (2026-08-18 사장님 지시)
     소개서만 오고 아무 말이 없으면 문의한 쪽은 "접수가 된 건가" 를 모른다.
     끝까지 안 읽어도 보이도록 인사 바로 뒤에 박스로 둔다 -->
<!-- 상담 배너 — 예전의 "영업일 2일 이내 안내" 안내박스를 대체한다. (2026-08-20)
     사장님: *"목적은 바로 연락이 오가게 하려고. 상담해주고 얘기 나누고 해야 일이 풀린다."*
     기다리게 하는 문장 대신 **지금 잡을 수 있는 자리**를 준다. 영업일 2일은 없애지
     않고 아래 한 줄로 남긴다 — 약속은 지켜야 하니까.
     캘린들리 대신 카톡/문자에서 스케줄링한다(사장님 방식). -->
<table role="presentation" width="100%" style="width:100%;border-collapse:collapse;background:#fee500;border-radius:12px;margin:0 0 22px">
  <tr><td style="padding:20px 22px">
    <p style="font-size:16px;font-weight:700;color:#191600;margin:0 0 6px">15분 사전상담 받기</p>
    <p style="font-size:13px;color:#3b3600;line-height:1.8;margin:0 0 14px">
      브랜드 목표와 현재 상황을 미리 준비해 주시면 더 유익한 상담이 됩니다.<br>
      상담은 <strong>줌미팅 또는 유선</strong> 중 편하신 쪽으로 진행하고, 일정은 카카오톡에서 바로 잡아 드립니다.
    </p>
    <a href="${KAKAO_CHANNEL.chatUrl}" style="display:inline-block;background:#191600;color:#fee500;text-decoration:none;padding:12px 24px;border-radius:999px;font-size:14px;font-weight:700">
      카카오톡으로 상담 잡기
    </a>
    <p style="font-size:12px;color:#5b5400;line-height:1.7;margin:12px 0 0">
      따로 요청하지 않으셔도 <strong>영업일 2일 이내</strong>에 안내 연락을 드립니다. 부재 시 문자를 남겨 드립니다.
    </p>
  </td></tr>
</table>

${para(
  "해그로시는 <strong>종합 마케팅과 브랜드 컨텐츠 덕션을 함께 운영하는 스튜디오</strong>입니다. 브랜드 유튜브·인스타그램 등 SNS 채널과, 인플루언서 시딩 바이럴 그리고 그 소스의 2차 활용을 통한 구매 전환형 숏폼 기획제작을 함께 진행합니다.",
)}

<img src="${PUBLIC_ORIGIN}/deck/mail-hero.jpg" alt="해그로시 촬영 현장" width="512" style="width:100%;max-width:512px;border-radius:12px;display:block;margin:4px 0 20px">

<!-- 소개서를 위로 올리고 표지를 함께 띄운다. (2026-08-20 사장님)
     첨부 파일 이름만으로는 무엇이 들었는지 안 보인다. 표지 한 장이면 열기 전에
     "브랜드 성공 사례와 서비스 플랜" 이 들어 있다는 게 전달된다. -->
<table role="presentation" width="100%" style="width:100%;border-collapse:collapse;background:#f7f5f3;border-radius:12px;margin:0 0 14px">
  <tr><td style="padding:20px 22px">
    <p style="font-size:15px;font-weight:700;margin:0 0 6px">해그로시 스튜디오 종합 소개서</p>
    <p style="font-size:13px;color:#5c5c5c;line-height:1.8;margin:0 0 14px">
      <strong style="color:#030303">브랜드 성공 사례와 서비스 플랜</strong>을 한 부에 담았습니다.<br>
      이 메일에 PDF로 첨부해 두었고, 아래 버튼으로도 바로 보실 수 있습니다.
    </p>
    <a href="${brochureUrl}">
      <img src="${PUBLIC_ORIGIN}/deck/brochure-cover.jpg" alt="해그로시 스튜디오 종합 소개서 표지" width="512" style="width:100%;max-width:512px;border-radius:8px;border:1px solid #e6e6e6;display:block">
    </a>
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
    subject: `[문의] ${input.companyName} · ${input.planLabel}`,
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
