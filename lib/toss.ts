const TOSS_API = "https://api.tosspayments.com/v1";

function authHeader() {
  const secret = process.env.TOSS_SECRET_KEY;
  if (!secret) throw new Error("TOSS_SECRET_KEY가 설정되지 않았습니다");
  // 시크릿 키 뒤에 콜론을 붙여 Basic 인증 — 비밀번호는 빈 값
  return `Basic ${Buffer.from(`${secret}:`).toString("base64")}`;
}

export type TossPayment = {
  paymentKey: string;
  orderId: string;
  status: string; // DONE | WAITING_FOR_DEPOSIT | CANCELED ...
  method: string | null;
  totalAmount: number;
  approvedAt: string | null;
  virtualAccount: {
    accountNumber: string;
    bankCode: string;
    dueDate: string;
    customerName: string;
  } | null;
};

export type TossError = { code: string; message: string };

/** 결제 승인. 서버에서만 호출한다 — 시크릿 키가 필요하다 */
export async function confirmPayment(params: {
  paymentKey: string;
  orderId: string;
  amount: number;
}): Promise<{ ok: true; payment: TossPayment } | { ok: false; error: TossError }> {
  const res = await fetch(`${TOSS_API}/payments/confirm`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      // 같은 주문이 중복 승인되지 않도록 멱등키를 붙인다
      "Idempotency-Key": params.orderId,
    },
    body: JSON.stringify(params),
    cache: "no-store",
  });

  const json = await res.json();

  if (!res.ok) {
    return {
      ok: false,
      error: {
        code: json.code ?? "UNKNOWN",
        message: json.message ?? "결제 승인에 실패했습니다.",
      },
    };
  }

  return { ok: true, payment: json as TossPayment };
}

/** 결제 조회 — 웹훅 수신 시 내용을 신뢰하지 않고 여기서 다시 확인한다 */
export async function fetchPaymentByOrderId(
  orderId: string,
): Promise<TossPayment | null> {
  const res = await fetch(`${TOSS_API}/payments/orders/${orderId}`, {
    headers: { Authorization: authHeader() },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as TossPayment;
}

/** 사용자에게 보여줄 한국어 메시지 */
export function tossErrorMessage(code: string): string {
  const map: Record<string, string> = {
    PAY_PROCESS_CANCELED: "결제를 취소하셨습니다.",
    PAY_PROCESS_ABORTED: "결제가 중단되었습니다. 다시 시도해 주세요.",
    REJECT_CARD_COMPANY: "카드사에서 결제를 거절했습니다. 다른 수단으로 시도해 주세요.",
    INVALID_CARD_EXPIRATION: "카드 유효기간을 확인해 주세요.",
    EXCEED_MAX_CARD_INSTALLMENT_PLAN: "선택하신 할부 개월 수를 지원하지 않습니다.",
    NOT_SUPPORTED_INSTALLMENT_PLAN_CARD_OR_MERCHANT: "해당 카드는 할부를 지원하지 않습니다.",
    ALREADY_PROCESSED_PAYMENT: "이미 처리된 결제입니다.",
  };
  return map[code] ?? "결제 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.";
}
