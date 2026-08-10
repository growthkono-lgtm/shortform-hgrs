"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { brochureMail, projectStartMail, sendMail } from "@/lib/mail";
import { FIRST_SEEDING_STAGE, FIRST_SHORTS_STAGE } from "@/lib/stages";

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
    .select("id, email, contact_name")
    .eq("id", id)
    .maybeSingle();
  if (!inquiry) return fail("신청 정보를 찾지 못했습니다.");

  const mail = brochureMail(inquiry.contact_name);
  const res = await sendMail({
    kind: "brochure",
    to: inquiry.email,
    subject: mail.subject,
    html: mail.html,
    inquiryId: inquiry.id,
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

/** 인플루언서 후보 등록 — 지표는 외부 플랫폼 기준으로 어드민이 직접 넣는다 */
export async function addCandidate(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const projectId = String(formData.get("project_id") ?? "");
  const channelUrl = String(formData.get("channel_url") ?? "").trim();
  const channelName = String(formData.get("channel_name") ?? "").trim();
  if (!projectId || !channelUrl || !channelName) {
    return fail("채널명과 링크는 필수입니다.");
  }

  const num = (key: string) => {
    const raw = String(formData.get(key) ?? "").replace(/[^\d]/g, "");
    return raw ? Number(raw) : null;
  };

  const admin = createAdminClient();
  const { error } = await admin.from("influencer_candidates").insert({
    project_id: projectId,
    channel_url: channelUrl,
    channel_name: channelName,
    platform: String(formData.get("platform") ?? "instagram"),
    follower_count: num("follower_count"),
    content_count: num("content_count"),
    avg_views: num("avg_views"),
    avg_comments: num("avg_comments"),
    avg_likes: num("avg_likes"),
    avg_cpv: num("avg_cpv"),
    note: String(formData.get("note") ?? "").trim() || null,
  });

  if (error) return fail("후보를 저장하지 못했습니다.");
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/app");
  return done("후보를 추가했습니다.");
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
      final_drive_link: String(formData.get("final_drive_link") ?? "").trim() || null,
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
