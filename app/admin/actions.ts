"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { BROCHURE, brochureMail, brochureUrl, projectStartMail, sendMail } from "@/lib/mail";
import { FIRST_SEEDING_STAGE, FIRST_SHORTS_STAGE } from "@/lib/stages";
import { parseChannelUrl } from "@/lib/channel-url";
import { computeCpv, fetchChannelMetrics } from "@/lib/channel-metrics";

export type ActionState = { ok: boolean; message: string | null };

const done = (message: string): ActionState => ({ ok: true, message });
const fail = (message: string): ActionState => ({ ok: false, message });

/** 신청 건에 소개서(플랜 안내)를 보낸다 */
export async function sendBrochure(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("inquiry_id") ?? "");
  if (!id) return fail("신청 정보를 찾지 못했습니다.");

  const admin = createAdminClient();
  const { data: inquiry } = await admin
    .from("inquiries")
    .select("id, email, contact_name, company_name, diagnosis")
    .eq("id", id)
    .maybeSingle();
  if (!inquiry) return fail("신청 정보를 찾지 못했습니다.");

  const mail = brochureMail(inquiry);
  const res = await sendMail({
    kind: "brochure",
    to: inquiry.email,
    subject: mail.subject,
    html: mail.html,
    inquiryId: inquiry.id,
    // 소개서는 첨부와 링크를 함께 보낸다 — 첨부를 막아 둔 메일 환경이 적지 않다
    attachments: [{ filename: BROCHURE.filename, path: brochureUrl }],
  });

  if (res.ok) {
    await admin
      .from("inquiries")
      .update({ status: "sent", brochure_sent_at: new Date().toISOString() })
      .eq("id", id);
  }

  revalidatePath("/admin");
  return res.ok
    ? done("소개서를 발송했습니다.")
    : fail(
        res.skipped
          ? "발송 키(RESEND_API_KEY)가 없어 건너뛰었습니다. 이력에 skipped로 남았습니다."
          : `발송 실패: ${res.error}`,
      );
}

/**
 * **적용 시작** — 이 버튼 하나가 프로젝트를 연다.
 *
 * 1) 신청 건 + 선택한 플랜으로 projects 생성 (결제 경유 아님 → order_id null)
 * 2) 신청 상태를 applied 로
 * 3) 클라이언트에게 시작 안내 메일
 *
 * 신청자가 아직 가입 전이면 프로젝트를 붙일 계정이 없다 —
 * 같은 이메일의 profiles 를 찾고, 없으면 여기서 막는다(가입 안내가 먼저다).
 */
export async function startProject(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const inquiryId = String(formData.get("inquiry_id") ?? "");
  const planId = String(formData.get("plan_id") ?? "");
  if (!inquiryId || !planId) return fail("신청과 플랜을 모두 선택해 주세요.");

  const admin = createAdminClient();

  const { data: inquiry } = await admin
    .from("inquiries")
    .select("id, email, contact_name, company_name, project_id")
    .eq("id", inquiryId)
    .maybeSingle();
  if (!inquiry) return fail("신청 정보를 찾지 못했습니다.");
  if (inquiry.project_id) return fail("이미 적용된 신청입니다.");

  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", inquiry.email)
    .eq("signup_completed", true)
    .maybeSingle();
  if (!profile) {
    return fail(
      "이 이메일로 가입된 계정이 없습니다. 신청자가 가입을 마쳐야 프로젝트를 열 수 있습니다.",
    );
  }

  const { data: plan } = await admin
    .from("plans")
    .select("id, code, label")
    .eq("id", planId)
    .maybeSingle();
  if (!plan) return fail("플랜을 찾지 못했습니다.");

  const { data: project, error } = await admin
    .from("projects")
    .insert({
      user_id: profile.id,
      plan_id: plan.id,
      inquiry_id: inquiry.id,
      type: plan.code,
      stage_a: plan.code === "full" ? FIRST_SEEDING_STAGE : null,
      stage_b: FIRST_SHORTS_STAGE,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !project) return fail("프로젝트를 만들지 못했습니다.");

  // 가이드라인 입력 자리를 미리 열어 둔다 — 클라이언트가 바로 채울 수 있게
  await admin.from("project_guidelines").insert({ project_id: project.id });

  await admin
    .from("inquiries")
    .update({
      status: "applied",
      project_id: project.id,
      applied_at: new Date().toISOString(),
    })
    .eq("id", inquiry.id);

  const mail = projectStartMail(inquiry.contact_name, plan.label);
  const res = await sendMail({
    kind: "project_start",
    to: inquiry.email,
    subject: mail.subject,
    html: mail.html,
    inquiryId: inquiry.id,
    projectId: project.id,
  });

  revalidatePath("/admin");
  revalidatePath("/app");
  return done(
    res.ok
      ? "프로젝트를 시작하고 안내 메일을 보냈습니다."
      : "프로젝트를 시작했습니다. (메일은 발송되지 않았습니다 — 발송 이력 확인)",
  );
}

/** 단계 전이 — 시딩/숏폼 트랙 각각 */
export async function setStage(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const projectId = String(formData.get("project_id") ?? "");
  const track = String(formData.get("track") ?? "");
  const stage = String(formData.get("stage") ?? "");
  if (!projectId || !stage) return fail("단계 정보를 확인해 주세요.");

  const admin = createAdminClient();
  // 동적 키로 넘기면 타입이 never 로 좁혀진다 — 컬럼별로 갈라 쓴다
  const patch =
    track === "seeding" ? { stage_a: stage } : { stage_b: stage };
  const { error } = await admin.from("projects").update(patch).eq("id", projectId);

  if (error) return fail("단계를 바꾸지 못했습니다.");
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/app");
  return done("단계를 변경했습니다.");
}

/**
 * 인플루언서 후보 등록 — **채널 링크 한 줄이면 된다.**
 *
 * 플랫폼·채널명은 URL에서 뽑고, 팔로워·조회수 등 지표는 Apify 로 바로 수집한다.
 * 수집이 실패해도 후보는 저장한다 — 링크는 남기고 사유를 적어 둔 뒤 다시 시도하면 된다.
 * 실패를 이유로 저장을 막으면 벤더가 흔들릴 때마다 작업이 통째로 멈춘다.
 */
export async function addCandidate(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const projectId = String(formData.get("project_id") ?? "");
  const rawUrl = String(formData.get("channel_url") ?? "").trim();
  if (!projectId || !rawUrl) return fail("채널 링크를 입력해 주세요.");

  const parsed = parseChannelUrl(rawUrl);
  if (!parsed) return fail("채널 링크 형식을 확인해 주세요.");

  const rewardRaw = String(formData.get("reward") ?? "").replace(/[^\d]/g, "");
  const reward = rewardRaw ? Number(rewardRaw) : null;

  const result = await fetchChannelMetrics(parsed.url);
  const m = result.ok ? result.metrics : null;

  const admin = createAdminClient();
  const { error } = await admin.from("influencer_candidates").insert({
    project_id: projectId,
    channel_url: parsed.url,
    channel_name: m?.displayName || parsed.handle || parsed.url,
    platform: parsed.platform,
    thumbnail_url: m?.thumbnailUrl ?? null,
    follower_count: m?.followerCount ?? null,
    content_count: m?.contentCount ?? null,
    avg_views: m?.avgViews ?? null,
    avg_likes: m?.avgLikes ?? null,
    avg_comments: m?.avgComments ?? null,
    avg_cpv: computeCpv(reward, m?.avgViews ?? null),
    reward,
    note: String(formData.get("note") ?? "").trim() || null,
    fetch_error: result.ok ? null : result.error,
    fetched_at: result.ok ? new Date().toISOString() : null,
    snapshot_at: new Date().toISOString(),
  });

  if (error) return fail("후보를 저장하지 못했습니다.");
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/app");
  return result.ok
    ? done("후보를 추가하고 지표를 수집했습니다.")
    : fail(`후보는 저장했습니다. 지표 수집은 실패 — ${result.error}`);
}

/** 지표 다시 수집 — 벤더가 흔들렸거나 시간이 지나 값이 낡았을 때 */
export async function refreshCandidate(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("candidate_id") ?? "");
  const projectId = String(formData.get("project_id") ?? "");
  if (!id) return fail("후보를 찾지 못했습니다.");

  const admin = createAdminClient();
  const { data: candidate } = await admin
    .from("influencer_candidates")
    .select("channel_url, reward")
    .eq("id", id)
    .maybeSingle();
  if (!candidate) return fail("후보를 찾지 못했습니다.");

  const result = await fetchChannelMetrics(candidate.channel_url);
  if (!result.ok) {
    await admin
      .from("influencer_candidates")
      .update({ fetch_error: result.error })
      .eq("id", id);
    revalidatePath(`/admin/projects/${projectId}`);
    return fail(`수집 실패 — ${result.error}`);
  }

  const m = result.metrics;
  await admin
    .from("influencer_candidates")
    .update({
      channel_name: m.displayName ?? undefined,
      thumbnail_url: m.thumbnailUrl,
      follower_count: m.followerCount,
      content_count: m.contentCount,
      avg_views: m.avgViews,
      avg_likes: m.avgLikes,
      avg_comments: m.avgComments,
      avg_cpv: computeCpv(candidate.reward, m.avgViews),
      fetch_error: null,
      fetched_at: new Date().toISOString(),
      snapshot_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/app");
  return done("지표를 새로 수집했습니다.");
}

/** 제안 단가 입력 — CPV 는 여기서 다시 계산된다 */
export async function setCandidateReward(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("candidate_id") ?? "");
  const projectId = String(formData.get("project_id") ?? "");
  const raw = String(formData.get("reward") ?? "").replace(/[^\d]/g, "");
  const reward = raw ? Number(raw) : null;

  const admin = createAdminClient();
  const { data: candidate } = await admin
    .from("influencer_candidates")
    .select("avg_views")
    .eq("id", id)
    .maybeSingle();
  if (!candidate) return fail("후보를 찾지 못했습니다.");

  const { error } = await admin
    .from("influencer_candidates")
    .update({ reward, avg_cpv: computeCpv(reward, candidate.avg_views) })
    .eq("id", id);

  if (error) return fail("단가를 저장하지 못했습니다.");
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/app");
  return done("단가를 저장했습니다.");
}

export async function removeCandidate(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("candidate_id") ?? "");
  const projectId = String(formData.get("project_id") ?? "");
  const admin = createAdminClient();
  await admin.from("influencer_candidates").delete().eq("id", id);
  revalidatePath(`/admin/projects/${projectId}`);
  return done("후보를 삭제했습니다.");
}

/** 숏폼 산출물 — 1차 미리보기 임베드 / 최종 드라이브 링크 */
export async function upsertDeliverable(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const projectId = String(formData.get("project_id") ?? "");
  const seq = Number(String(formData.get("seq") ?? "0"));
  if (!projectId || !seq) return fail("편 번호를 확인해 주세요.");

  const admin = createAdminClient();
  const { error } = await admin.from("deliverables").upsert(
    {
      project_id: projectId,
      seq,
      title: String(formData.get("title") ?? "").trim() || null,
      preview_url: String(formData.get("preview_url") ?? "").trim() || null,
      status: String(formData.get("status") ?? "producing"),
    },
    { onConflict: "project_id,seq" },
  );

  if (error) return fail("산출물을 저장하지 못했습니다.");
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/app");
  return done("산출물을 저장했습니다.");
}

/** 구글 드라이브 링크 — 시딩 결과물 / 최종 납품본 */
export async function setDriveLink(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const projectId = String(formData.get("project_id") ?? "");
  const kind = String(formData.get("kind") ?? "final");
  const link = String(formData.get("drive_link") ?? "").trim();
  if (!projectId || !link) return fail("드라이브 링크를 입력해 주세요.");

  const admin = createAdminClient();
  // 같은 종류는 하나만 유지한다 — 링크가 여러 개면 어느 게 최신인지 클라이언트가 모른다
  await admin.from("drive_grants").delete().eq("project_id", projectId).eq("kind", kind);
  const { error } = await admin.from("drive_grants").insert({
    project_id: projectId,
    kind,
    drive_folder_id: link.split("/").pop() ?? link,
    drive_link: link,
  });

  if (error) return fail("링크를 저장하지 못했습니다.");
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/app");
  return done("드라이브 링크를 저장했습니다.");
}
