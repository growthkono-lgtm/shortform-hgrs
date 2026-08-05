"use server";

import { randomUUID } from "node:crypto";
import { requireProfile } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { getPlanBySlug, planOrderName } from "@/lib/plans";

export type CreateOrderResult =
  | { ok: true; orderId: string; amount: number; orderName: string }
  | { ok: false; error: string };

/**
 * 결제 전 주문(pending)을 만든다.
 *
 * 금액은 **여기서 DB의 plans를 읽어 정한다.** 클라이언트가 보낸 금액은 받지도 않는다.
 * 승인 단계(/api/payments/confirm)에서 토스가 돌려준 금액과 이 값을 다시 대조한다.
 */
export async function createOrder(
  planSlug: string,
  input: {
    bizRegNumber?: string;
    taxInvoiceEmail?: string;
    brandProfileId?: string;
  },
): Promise<CreateOrderResult> {
  const profile = await requireProfile();

  const plan = await getPlanBySlug(planSlug);
  if (!plan) return { ok: false, error: "판매 중인 플랜이 아닙니다." };

  const admin = createAdminClient();

  // 브랜드 프로필을 지정했다면 본인 소유인지 확인 (남의 브랜드 id 주입 차단)
  if (input.brandProfileId) {
    const { data: brand } = await admin
      .from("brand_profiles")
      .select("id")
      .eq("id", input.brandProfileId)
      .eq("user_id", profile.id)
      .maybeSingle();
    if (!brand) return { ok: false, error: "선택한 브랜드를 찾을 수 없습니다." };
  }

  // 토스 orderId 규격: 영문·숫자·'-'·'_' 6~64자
  const tossOrderId = `hgrs-${randomUUID()}`;

  const { data: order, error } = await admin
    .from("orders")
    .insert({
      user_id: profile.id,
      plan_id: plan.id,
      status: "pending",
      toss_order_id: tossOrderId,
      amount: plan.beta_price,
      biz_reg_number: input.bizRegNumber || null,
      tax_invoice_email: input.taxInvoiceEmail || null,
      brand_profile_id: input.brandProfileId || null,
    })
    .select("toss_order_id, amount")
    .single();

  if (error || !order) {
    return {
      ok: false,
      error: "주문 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }

  return {
    ok: true,
    orderId: order.toss_order_id,
    amount: order.amount,
    orderName: planOrderName(plan),
  };
}
