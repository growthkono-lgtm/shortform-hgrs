"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { notifyProjectDone } from "@/lib/work-mail";

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

  /**
   * 필수 세 칸은 서버에서 막는다. (2026-08-14)
   *
   * 이 표는 **작업자에게 나가는 유일한 문서**다. 링크·가격·프로모션이 비면
   * 제작자가 무엇을 파는 물건인지 모르는 채로 시작하게 된다. 화면에 "필수"
   * 라고 적어 두는 것만으로는 안 비는 걸 보장하지 못한다
   */
  const missing = (
    [
      ["reference_urls", "판매 링크"],
      ["price_range", "가격 · 옵션 · 수량"],
      ["promotion", "진행 중인 프로모션"],
    ] as const
  ).filter(([key]) => !text(key));

  if (missing.length) {
    return fail(
      `${missing.map(([, label]) => label).join(" · ")} 은(는) 반드시 넣어 주세요. 없으면 '없음' 이라고 적어 주셔도 됩니다.`,
    );
  }

  const admin = createAdminClient();
  const { error } = await admin.from("project_guidelines").upsert(
    {
      project_id: projectId,
      brand_intro: text("brand_intro"),
      target: text("target"),
      usp: text("usp"),
      price_range: text("price_range"),
      promotion: text("promotion"),
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
  // 작업자 화면이 이 표를 직접 읽는다 — 저장 즉시 반영되어야 한다
  revalidatePath("/work", "layout");
  return done("저장했습니다. 담당 제작자 화면에 그대로 전달됩니다.");
}

/**
 * 미팅 코멘트 — 브랜드 정보 아래에 붙어 작업자에게 그대로 보인다.
 *
 * 담당자가 정리한 정보만으로는 부족할 때 클라이언트가 직접 얹는 칸이다.
 * 작업자 화면에서 "클라이언트 코멘트"로 뜬다.
 */
export async function saveClientNote(
  _prev: ClientActionState,
  formData: FormData,
): Promise<ClientActionState> {
  const profile = await requireProfile();
  const projectId = String(formData.get("project_id") ?? "");
  const note = String(formData.get("client_note") ?? "").trim();
  if (!projectId || !(await ownProject(projectId, profile.id))) {
    return fail("프로젝트를 찾지 못했습니다.");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("work_briefs")
    .upsert(
      { project_id: projectId, client_note: note || null },
      { onConflict: "project_id" },
    );

  if (error) return fail("저장하지 못했습니다.");
  revalidatePath("/app");
  revalidatePath("/work");
  return done("전달했습니다. 담당 제작자가 바로 확인합니다.");
}

/**
 * 1차 완성본 확인 완료 — 이 버튼이 마지막 단계를 연다.
 *
 * 작업자는 review 까지만 밀 수 있다. 자기 결과물을 스스로 "확인됨"으로 넘길 수는 없어야 해서다.
 * 여기서 done 으로 가면 클라이언트 화면은 "최종본 다운로드/확인"이 된다.
 */
export async function confirmDeliverable(
  _prev: ClientActionState,
  formData: FormData,
): Promise<ClientActionState> {
  const profile = await requireProfile();
  const projectId = String(formData.get("project_id") ?? "");
  const deliverableId = String(formData.get("deliverable_id") ?? "");
  if (!projectId || !(await ownProject(projectId, profile.id))) {
    return fail("프로젝트를 찾지 못했습니다.");
  }

  const admin = createAdminClient();
  const { data: item } = await admin
    .from("deliverables")
    .select("seq")
    .eq("id", deliverableId)
    .eq("project_id", projectId)
    .maybeSingle();

  const { error } = await admin
    .from("deliverables")
    .update({ work_status: "done", status: "approved" })
    .eq("id", deliverableId)
    .eq("project_id", projectId);

  if (error) return fail("처리하지 못했습니다.");
  if (item) await notifyProjectDone(projectId, item.seq);
  revalidatePath("/app");
  revalidatePath("/work");
  revalidatePath("/admin/review");
  return done("확인 완료 처리했습니다.");
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

  // 클라이언트 트랙과 작업자 트랙을 함께 민다.
  // 수정 요청은 우리 검수를 거치지 않고 작업자에게 바로 간다 — 클라이언트가 직접 쓴 내용이라
  // 우리가 중간에서 다시 판단할 게 없고, 하루를 벌 수 있다
  await admin
    .from("deliverables")
    .update({
      status: "revision",
      work_status: "revising",
      revision_round: 1,
    })
    .eq("id", deliverableId);

  revalidatePath("/app");
  revalidatePath("/work");
  revalidatePath(`/work/${deliverableId}`);
  return done("수정 요청을 보냈습니다.");
}

/** 발송완료 — 브랜드가 행마다 직접 누른다. 이걸 눌러야 리마인드가 멈춘다 */
export async function markShipped(
  _prev: ClientActionState,
  formData: FormData,
): Promise<ClientActionState> {
  const profile = await requireProfile();
  const projectId = String(formData.get("project_id") ?? "");
  const shipmentId = String(formData.get("shipment_id") ?? "");
  if (!projectId || !(await ownProject(projectId, profile.id))) {
    return fail("프로젝트를 찾지 못했습니다.");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("seeding_shipments")
    .update({ shipped_at: new Date().toISOString() })
    .eq("id", shipmentId)
    .eq("project_id", projectId);

  if (error) return fail("처리하지 못했습니다.");
  revalidatePath("/app");
  revalidatePath(`/admin/projects/${projectId}`);
  return done("발송완료로 표시했습니다.");
}

/** 콘텐츠 검수 — 확인만 누르거나, 고칠 곳을 적어 보낸다 */
export async function approveContent(
  _prev: ClientActionState,
  formData: FormData,
): Promise<ClientActionState> {
  const profile = await requireProfile();
  const projectId = String(formData.get("project_id") ?? "");
  const contentId = String(formData.get("content_id") ?? "");
  const note = String(formData.get("revision_note") ?? "").trim();
  if (!projectId || !(await ownProject(projectId, profile.id))) {
    return fail("프로젝트를 찾지 못했습니다.");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("influencer_contents")
    .update({
      // 고칠 곳을 적었으면 수정 요청, 아니면 검수 완료
      review_status: note ? "revision" : "approved",
      revision_note: note || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", contentId)
    .eq("project_id", projectId);

  if (error) return fail("처리하지 못했습니다.");
  revalidatePath("/app");
  revalidatePath(`/admin/projects/${projectId}`);
  return done(note ? "수정 요청을 전달했습니다." : "검수 완료로 표시했습니다.");
}
