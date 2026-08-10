"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/server";

export type ClientActionState = { ok: boolean; message: string | null };

const done = (message: string): ClientActionState => ({ ok: true, message });
const fail = (message: string): ClientActionState => ({ ok: false, message });

/** 이 프로젝트가 정말 이 사람 것인지 확인한다 — id는 폼에서 오므로 신뢰하지 않는다 */
async function ownProject(projectId: string, userId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(data);
}

/** 컨텐츠 가이드라인 제출 — 플랜 적용 직후 클라이언트가 채운다 */
export async function saveGuideline(
  _prev: ClientActionState,
  formData: FormData,
): Promise<ClientActionState> {
  const profile = await requireProfile();
  const projectId = String(formData.get("project_id") ?? "");
  if (!projectId || !(await ownProject(projectId, profile.id))) {
    return fail("프로젝트를 찾지 못했습니다.");
  }

  const text = (key: string) => String(formData.get(key) ?? "").trim() || null;
  const admin = createAdminClient();
  const { error } = await admin.from("project_guidelines").upsert(
    {
      project_id: projectId,
      brand_intro: text("brand_intro"),
      target: text("target"),
      usp: text("usp"),
      price_range: text("price_range"),
      tone: text("tone"),
      forbidden: text("forbidden"),
      reference_urls: text("reference_urls"),
      extra: text("extra"),
      submitted_at: new Date().toISOString(),
    },
    { onConflict: "project_id" },
  );

  if (error) return fail("저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  revalidatePath("/app");
  return done("가이드라인을 저장했습니다.");
}

/** 인플루언서 후보 선택/해제 — 최종 확정은 어드민이 단가를 보고 한다 */
export async function toggleCandidate(
  _prev: ClientActionState,
  formData: FormData,
): Promise<ClientActionState> {
  const profile = await requireProfile();
  const projectId = String(formData.get("project_id") ?? "");
  const candidateId = String(formData.get("candidate_id") ?? "");
  if (!projectId || !(await ownProject(projectId, profile.id))) {
    return fail("프로젝트를 찾지 못했습니다.");
  }

  const admin = createAdminClient();
  const { data: candidate } = await admin
    .from("influencer_candidates")
    .select("id, selected")
    .eq("id", candidateId)
    .eq("project_id", projectId)
    .maybeSingle();
  if (!candidate) return fail("후보를 찾지 못했습니다.");

  const next = !candidate.selected;
  const { error } = await admin
    .from("influencer_candidates")
    .update({
      selected: next,
      selected_at: next ? new Date().toISOString() : null,
    })
    .eq("id", candidateId);

  if (error) return fail("선택을 저장하지 못했습니다.");
  revalidatePath("/app");
  return done(next ? "선택했습니다." : "선택을 해제했습니다.");
}

/**
 * 수정 요청 — 딜리버러블당 무상 1회.
 * 라운드 unique 제약이 DB에서 두 번째 요청을 막는다.
 */
export async function requestRevision(
  _prev: ClientActionState,
  formData: FormData,
): Promise<ClientActionState> {
  const profile = await requireProfile();
  const projectId = String(formData.get("project_id") ?? "");
  const deliverableId = String(formData.get("deliverable_id") ?? "");
  const message = String(formData.get("message") ?? "").trim();
  if (!projectId || !(await ownProject(projectId, profile.id))) {
    return fail("프로젝트를 찾지 못했습니다.");
  }
  if (!message) return fail("수정 요청 내용을 적어 주세요.");

  const admin = createAdminClient();
  const { error } = await admin.from("revision_requests").insert({
    deliverable_id: deliverableId,
    user_id: profile.id,
    message,
    round: 1,
  });

  if (error) {
    return fail(
      error.code === "23505"
        ? "이미 무상 수정 요청을 보내셨습니다. 추가 수정은 편당 별도 견적입니다."
        : "요청을 보내지 못했습니다.",
    );
  }

  await admin
    .from("deliverables")
    .update({ status: "revision" })
    .eq("id", deliverableId);

  revalidatePath("/app");
  return done("수정 요청을 보냈습니다.");
}
