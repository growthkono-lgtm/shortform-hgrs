import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { fetchPaymentByOrderId } from "@/lib/toss";
import { createProjectForOrder } from "@/lib/orders";

/**
 * 가상계좌 입금 통지 (PART F4).
 *
 * 웹훅 본문은 서명 검증이 없으므로 **신뢰하지 않는다.**
 * orderId만 꺼내 토스 조회 API로 실제 상태를 다시 확인한 뒤 반영한다.
 */
export async function POST(request: NextRequest) {
  let payload: { eventType?: string; data?: { orderId?: string } };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const orderId = payload.data?.orderId;
  if (!orderId) return NextResponse.json({ ok: true });

  const payment = await fetchPaymentByOrderId(orderId);
  if (!payment) return NextResponse.json({ ok: true });

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, status")
    .eq("toss_order_id", orderId)
    .maybeSingle();

  if (!order) return NextResponse.json({ ok: true });

  if (payment.status === "DONE" && order.status !== "paid") {
    await admin
      .from("orders")
      .update({
        status: "paid",
        toss_payment_key: payment.paymentKey,
        paid_at: payment.approvedAt,
      })
      .eq("id", order.id);

    await createProjectForOrder(order.id);
  }

  if (
    (payment.status === "CANCELED" || payment.status === "EXPIRED") &&
    order.status === "pending"
  ) {
    await admin.from("orders").update({ status: "canceled" }).eq("id", order.id);
  }

  // 토스는 2xx가 아니면 재시도한다 — 처리 못 한 이벤트도 200으로 닫는다
  return NextResponse.json({ ok: true });
}
