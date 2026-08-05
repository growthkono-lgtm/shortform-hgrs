import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { confirmPayment, tossErrorMessage } from "@/lib/toss";
import { createProjectForOrder } from "@/lib/orders";

/**
 * 토스 결제 인증 후 착지점 (successUrl).
 *
 * 보안 골자 (PART F3·F4):
 *  1. 승인 금액은 **DB의 orders.amount**로 보낸다. 쿼리스트링 amount는 대조용일 뿐이다
 *  2. 두 값이 다르면 승인하지 않는다 — 금액 조작 차단
 *  3. 이미 paid면 다시 승인하지 않고 성공 화면으로 보낸다 (새로고침·중복 진입 대비)
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const paymentKey = searchParams.get("paymentKey");
  const orderId = searchParams.get("orderId");
  const amountParam = searchParams.get("amount");

  const fail = (message: string, code = "INVALID_REQUEST") =>
    NextResponse.redirect(
      `${origin}/checkout/fail?code=${encodeURIComponent(code)}&message=${encodeURIComponent(message)}`,
    );

  if (!paymentKey || !orderId || !amountParam) {
    return fail("결제 정보가 올바르지 않습니다.");
  }

  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select("id, user_id, plan_id, status, amount, brand_profile_id")
    .eq("toss_order_id", orderId)
    .maybeSingle();

  if (!order) return fail("주문을 찾을 수 없습니다.");

  // 이미 승인된 주문 — 재승인하지 않는다
  if (order.status === "paid") {
    return NextResponse.redirect(`${origin}/checkout/success?order=${order.id}`);
  }
  if (order.status !== "pending") {
    return fail("이미 취소되었거나 처리할 수 없는 주문입니다.");
  }

  // 클라이언트가 돌려준 금액과 DB 금액 대조
  if (Number(amountParam) !== order.amount) {
    return fail("결제 금액이 주문 정보와 일치하지 않습니다.", "AMOUNT_MISMATCH");
  }

  // 승인 요청에는 DB 금액을 쓴다
  const result = await confirmPayment({
    paymentKey,
    orderId,
    amount: order.amount,
  });

  if (!result.ok) {
    return fail(tossErrorMessage(result.error.code), result.error.code);
  }

  const payment = result.payment;

  // 가상계좌는 입금 전이라 아직 결제 완료가 아니다 — 웹훅에서 확정한다
  const isDeposited = payment.status === "DONE";

  await admin
    .from("orders")
    .update({
      status: isDeposited ? "paid" : "pending",
      toss_payment_key: payment.paymentKey,
      paid_at: payment.approvedAt,
    })
    .eq("id", order.id);

  if (isDeposited) {
    await createProjectForOrder(order.id);
  } else {
    return NextResponse.redirect(
      `${origin}/checkout/success?order=${order.id}&pending=vbank`,
    );
  }

  return NextResponse.redirect(`${origin}/checkout/success?order=${order.id}`);
}
