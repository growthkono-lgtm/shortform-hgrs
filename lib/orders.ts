import { createAdminClient } from "@/lib/supabase/server";
import { FIRST_SEEDING_STAGE, FIRST_SHORTS_STAGE } from "@/lib/stages";

/**
 * 결제 완료 주문에 프로젝트를 만든다. 이미 있으면 그대로 둔다.
 * projects.order_id가 unique라 중복 생성은 DB에서도 막힌다.
 */
export async function createProjectForOrder(orderId: string): Promise<string | null> {
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("projects")
    .select("id")
    .eq("order_id", orderId)
    .maybeSingle();
  if (existing) return existing.id;

  const { data: order } = await admin
    .from("orders")
    .select("id, user_id, brand_profile_id, plans(code, head_review)")
    .eq("id", orderId)
    .single();

  if (!order?.plans) return null;

  const isFull = order.plans.code === "full";

  const { data: project } = await admin
    .from("projects")
    .insert({
      order_id: order.id,
      user_id: order.user_id,
      brand_profile_id: order.brand_profile_id,
      type: order.plans.code,
      // 패키지는 시딩 트랙부터, 싱글은 시딩 없이 숏폼 트랙만 (PART E2)
      stage_a: isFull ? FIRST_SEEDING_STAGE : null,
      stage_b: FIRST_SHORTS_STAGE,
      head_review_status: order.plans.head_review ? "available" : null,
    })
    .select("id")
    .single();

  return project?.id ?? null;
}
