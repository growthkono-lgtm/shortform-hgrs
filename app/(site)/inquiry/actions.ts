"use server";

import { cookies, headers } from "next/headers";
import {
  FIRST_TOUCH_COOKIE,
  VISITOR_COOKIE,
  blogSlugOf,
  decodeTouch,
} from "@/lib/attribution";
import { createAdminClient } from "@/lib/supabase/server";
import { CONSENT_VERSION } from "@/lib/consents";
import { BROCHURE, brochureMail, brochureUrl, inquiryNoticeMail, sendMail } from "@/lib/mail";
import {
  INQUIRY_PLAN_VALUES,
  INQUIRY_SOURCE_LABEL,
  describeSelection,
} from "@/lib/inquiry-plans";
import { readDiagnosis, type DiagAnswers } from "@/lib/diagnosis";

export type InquiryState = { ok: boolean; error: string | null };

/**
 * 선택지는 `lib/inquiry-plans.ts` 한 곳에서만 정의한다. (2026-08-18)
 * 폼·서버·어드민이 각자 목록을 들고 있으면 하나를 늘릴 때 반드시 어긋난다.
 */
const INTERESTS = INQUIRY_PLAN_VALUES;
const VOLUMES = ["v1", "v5", "v10", "v20", "unknown"] as const;

const isOneOf = <T extends readonly string[]>(list: T, v: string) =>
  (list as readonly string[]).includes(v);

/**
 * 랜딩 신청 접수.
 *
 * 가격을 화면에 걸지 않기로 하면서 **이 폼이 유일한 공개 전환 경로**가 됐다.
 * 저장은 service_role 로만 한다 — anon 에게 insert 를 열면 스팸이 그대로 테이블에 쌓인다.
 * 소개서 자동 발송은 어드민 대시보드 이후에 붙인다(지금은 접수만).
 */
export async function submitInquiry(
  _prev: InquiryState,
  formData: FormData,
): Promise<InquiryState> {
  const companyName = String(formData.get("company_name") ?? "").trim();
  const contactName = String(formData.get("contact_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const brandUrl = String(formData.get("brand_url") ?? "").trim();
  const interest = String(formData.get("interest") ?? "");
  const volume = String(formData.get("volume") ?? "");
  const message = String(formData.get("message") ?? "").trim();
  const consentRequired = formData.get("consent_required") === "on";
  const marketing = formData.get("consent_marketing") === "on";
  const diagnosisRaw = String(formData.get("diagnosis") ?? "");

  if (!companyName || !contactName || !email) {
    return { ok: false, error: "회사명·담당자 이름·이메일은 필수입니다." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "이메일 주소를 다시 확인해 주세요." };
  }
  if (!isOneOf(INTERESTS, interest)) {
    return { ok: false, error: "어떤 프로젝트를 찾으시는지 선택해 주세요." };
  }
  if (!isOneOf(VOLUMES, volume)) {
    return { ok: false, error: "예상 편수를 선택해 주세요." };
  }
  if (!consentRequired) {
    return { ok: false, error: "개인정보 수집·이용에 동의해 주셔야 접수됩니다." };
  }

  let diagnosis: unknown = null;
  if (diagnosisRaw) {
    try {
      diagnosis = JSON.parse(diagnosisRaw);
    } catch {
      diagnosis = null;
    }
  }

  const head = await headers();
  const ip =
    head.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    head.get("x-real-ip") ??
    null;

  const admin = createAdminClient();

  /**
   * **중복 접수 차단.** (2026-08-19 사고 수습)
   *
   * 08-19 09:57, 실제 문의 한 건이 **22초 동안 7번 접수되고 고객에게 소개서
   * 메일이 7통 나갔다.** 화면 쪽 원인(제출 버튼이 안 잠김)은 따로 고쳤지만,
   * 그것만으로는 부족하다 — 새로고침·뒤로가기·네트워크 재시도에서 또 난다.
   * 보낸 메일은 되돌릴 수 없으니 **서버에서도** 막는다.
   *
   * 기준은 **같은 이메일 + 10분**이다. 같은 사람이 10분 안에 두 번 신청할
   * 이유는 없고, 정말 다시 보내고 싶으면 10분 뒤에 되거나 사장님이 받는다.
   * 회사명까지 열쇠로 쓰지 않는 이유: 이번 건도 `스크럽대디`·`스크럽 대디`
   * 로 띄어쓰기가 달랐다. 사람이 매번 똑같이 칠 거라고 가정하면 안 된다.
   *
   * ⚠️ 화면에는 **성공으로 돌려준다.** 여기서 "이미 신청하셨습니다" 를
   * 띄우면 고객은 자기가 뭘 잘못한 줄 안다. 실제로 접수는 되어 있다.
   */
  const TEN_MIN_AGO = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data: recent } = await admin
    .from("inquiries")
    .select("id")
    .eq("email", email)
    .gte("created_at", TEN_MIN_AGO)
    .limit(1);

  if (recent?.length) {
    return { ok: true, error: null };
  }

  const { data: inserted, error } = await admin
    .from("inquiries")
    .insert({
    company_name: companyName,
    contact_name: contactName,
    email,
    phone: phone || null,
    brand_url: brandUrl || null,
    interest,
    volume,
    message: message || null,
    diagnosis: diagnosis as never,
    consent_version: CONSENT_VERSION,
    marketing_agreed: marketing,
    ip_address: ip,
      user_agent: head.get("user-agent"),
    })
    .select("id, email, contact_name, company_name")
    .single();

  if (error || !inserted) {
    return { ok: false, error: "접수 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요." };
  }

  // 어디로 처음 들어온 사람인지 붙인다. 실패해도 접수는 이미 끝났다
  await attachFirstTouch(inserted.id);

  /**
   * 접수 즉시 소개서를 보낸다 (2026-08-11).
   *
   * 예전에는 어드민이 [소개서 발송]을 눌러야 나갔다. 문의한 사람은 그때까지
   * 아무것도 못 받는데, 그 사이가 제일 식는 구간이다.
   *
   * **발송 실패가 접수 실패로 번지면 안 된다.** 신청은 이미 DB에 들어갔고
   * 어드민에서 다시 보낼 수 있다. 그래서 결과를 화면에 되돌리지 않고
   * email_log(sendMail 내부)에만 남긴다.
   */
  const mail = brochureMail(inserted);
  const sent = await sendMail({
    kind: "brochure",
    to: inserted.email,
    subject: mail.subject,
    html: mail.html,
    inquiryId: inserted.id,
    // 첨부와 링크를 함께 — 첨부를 막아 둔 메일 환경이 적지 않다
    attachments: [{ filename: BROCHURE.filename, path: brochureUrl }],
  });

  if (sent.ok) {
    await admin
      .from("inquiries")
      .update({ status: "sent", brochure_sent_at: new Date().toISOString() })
      .eq("id", inserted.id);
  }

  /**
   * 소개서가 나간 사실을 contact@h-grs.com 에 알린다. (2026-08-18)
   *
   * 사장님 지시 — 어드민을 열지 않고도 받은편지함에서 바로 회신하실 수 있어야
   * 한다. 그래서 `replyTo` 에 **문의한 분의 주소**를 박는다.
   *
   * ⚠️ 이 알림은 **이 경로(신규 접수)에만** 붙인다. 어드민의 [소개서 재발송]
   * 에는 붙이지 않는다 — 사장님이 직접 누르시는 것이고, 그때마다 알림이 또
   * 오면 소음이다. 배포 이전에 접수된 건에도 당연히 소급 발송하지 않는다.
   *
   * 발송 실패가 접수 실패로 번지지 않는다. 소개서와 같은 원칙이다.
   */
  const diag = diagnosis as {
    answers?: DiagAnswers;
    plan?: { label?: string; composition?: string };
    source?: string;
  } | null;

  const picked = describeSelection({ interest, volume, source: diag?.source });

  const notice = inquiryNoticeMail({
    companyName,
    contactName,
    email,
    phone: phone || null,
    brandUrl: brandUrl || null,
    planLabel: picked.plan,
    countLabel: picked.count,
    from: INQUIRY_SOURCE_LABEL[diag?.source ?? ""] ?? "숏폼 랜딩 (/shortform)",
    checkLog: readDiagnosis(diag?.answers),
    recommended: diag?.plan?.label
      ? `${diag.plan.label}${diag.plan.composition ? ` (${diag.plan.composition})` : ""}`
      : null,
    message: message || null,
    sentTo: email,
  });

  await sendMail({
    kind: "inquiry_notice",
    to: "contact@h-grs.com",
    subject: notice.subject,
    html: notice.html,
    inquiryId: inserted.id,
    // 이 한 줄이 이 메일의 존재 이유다 — [답장] 이 고객에게 바로 간다
    replyTo: email,
  });

  return { ok: true, error: null };
}

/**
 * 접수된 신청에 **첫 접점**을 붙인다. (2026-08-19)
 *
 * ── 왜 insert 와 따로 하나 ─────────────────────────────────────────────
 * insert 페이로드에 새 컬럼을 섞으면, 마이그레이션이 아직 안 들어간 상태에서
 * **접수 자체가 통째로 실패한다.** 유입 분석은 있으면 좋은 것이고 접수는
 * 반드시 되어야 하는 것이다. 둘의 무게가 다르니 실패도 따로 떨어져야 한다.
 * 소개서 메일을 접수와 분리한 것과 같은 원칙이다.
 *
 * ── 무엇을 붙이나 ──────────────────────────────────────────────────────
 * 첫 착지가 `/blog/무엇` 이면 그 회차가 **데려온 글**이다(entry_post_id).
 * 첫 착지는 랜딩이었더라도 그 전후로 읽은 편이 있으면 어시스트로 남긴다 —
 * "블로그를 읽고 랜딩으로 넘어와 신청" 이 실제로 제일 흔한 모양이고,
 * 그걸 0 으로 세면 콘텐츠가 한 일이 장부에서 사라진다.
 */
async function attachFirstTouch(inquiryId: string) {
  try {
    const jar = await cookies();
    const visitorId = jar.get(VISITOR_COOKIE)?.value ?? null;
    const touch = decodeTouch(jar.get(FIRST_TOUCH_COOKIE)?.value);
    if (!visitorId && !touch) return;

    const admin = createAdminClient();

    /* 이 방문자가 본 블로그 글 — 처음 본 순서대로 */
    const seen = visitorId
      ? ((
          await admin
            .from("blog_visit")
            .select("slug, landing, first_seen")
            .eq("visitor_id", visitorId)
            .order("first_seen", { ascending: true })
        ).data ?? [])
      : [];

    const slugs = seen.map((v) => v.slug);
    const entrySlug = blogSlugOf(touch?.p);
    if (entrySlug && !slugs.includes(entrySlug)) slugs.push(entrySlug);

    /* 슬러그를 회차 id 로 바꾼다 */
    const byslug = new Map<string, string>();
    if (slugs.length) {
      const { data } = await admin
        .from("blog_post")
        .select("id, slug")
        .in("slug", slugs);
      for (const p of data ?? []) byslug.set(p.slug, p.id);
    }

    const entryId = entrySlug ? (byslug.get(entrySlug) ?? null) : null;
    const assists = seen
      .map((v) => byslug.get(v.slug))
      .filter((id): id is string => !!id && id !== entryId);

    await admin
      .from("inquiries")
      .update({
        visitor_id: visitorId,
        first_path: touch?.p ?? null,
        first_referrer: touch?.r ?? null,
        first_at: touch?.t ?? null,
        utm: (touch?.u ?? null) as never,
        entry_post_id: entryId,
        assist_post_ids: assists.length ? assists : null,
      })
      .eq("id", inquiryId);
  } catch {
    // 유입 기록 때문에 신청이 흔들리는 일은 없어야 한다
  }
}
