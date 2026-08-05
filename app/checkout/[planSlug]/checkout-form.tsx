"use client";

import { useEffect, useRef, useState } from "react";
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";
import { createOrder } from "../actions";
import { POLICY } from "@/lib/constants";
import { cn } from "@/lib/cn";

type Brand = { id: string; brand_name: string };

export function CheckoutForm({
  planSlug,
  amount,
  customerName,
  companyName,
  brands,
}: {
  planSlug: string;
  amount: number;
  customerEmail: string | null;
  customerName: string;
  companyName: string;
  brands: Brand[];
}) {
  const widgetsRef = useRef<Awaited<
    ReturnType<Awaited<ReturnType<typeof loadTossPayments>>["widgets"]>
  > | null>(null);

  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [brandId, setBrandId] = useState<string>(brands[0]?.id ?? "");
  const [bizRegNumber, setBizRegNumber] = useState("");
  const [taxEmail, setTaxEmail] = useState("");
  const [agreePolicy, setAgreePolicy] = useState(false);
  const [agreeRefund, setAgreeRefund] = useState(false);

  useEffect(() => {
    let disposed = false;

    (async () => {
      try {
        const tossPayments = await loadTossPayments(
          process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!,
        );
        // 비회원 결제가 아니라도 위젯은 ANONYMOUS로 띄운다.
        // 브랜드페이(카드 등록)는 Phase 2라 아직 customerKey가 필요 없다
        const widgets = tossPayments.widgets({ customerKey: ANONYMOUS });
        if (disposed) return;

        await widgets.setAmount({ currency: "KRW", value: amount });
        await Promise.all([
          widgets.renderPaymentMethods({ selector: "#toss-payment-methods" }),
          widgets.renderAgreement({ selector: "#toss-agreement" }),
        ]);

        if (disposed) return;
        widgetsRef.current = widgets;
        setReady(true);
      } catch {
        if (!disposed) setError("결제 모듈을 불러오지 못했습니다. 새로고침해 주세요.");
      }
    })();

    return () => {
      disposed = true;
    };
  }, [amount]);

  const canSubmit = ready && agreePolicy && agreeRefund && !submitting;

  async function handleSubmit() {
    if (!widgetsRef.current || !canSubmit) return;
    setSubmitting(true);
    setError(null);

    // 주문을 먼저 만든다 — 금액은 서버가 plans에서 읽어 정한다
    const result = await createOrder(planSlug, {
      bizRegNumber: bizRegNumber.trim() || undefined,
      taxInvoiceEmail: taxEmail.trim() || undefined,
      brandProfileId: brandId || undefined,
    });

    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    try {
      await widgetsRef.current.requestPayment({
        orderId: result.orderId,
        orderName: result.orderName,
        customerName,
        successUrl: `${window.location.origin}/api/payments/confirm`,
        failUrl: `${window.location.origin}/checkout/fail`,
      });
    } catch (e) {
      const message =
        e && typeof e === "object" && "message" in e
          ? String((e as { message: unknown }).message)
          : "결제를 시작하지 못했습니다.";
      setError(message);
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-10">
      {brands.length > 0 && (
        <section>
          <h2 className="text-lg font-bold">브랜드 선택</h2>
          <p className="mt-2 text-sm text-muted">
            등록해두신 브랜드 프로필을 이 프로젝트에 연결합니다.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {brands.map((brand) => (
              <button
                key={brand.id}
                type="button"
                onClick={() => setBrandId(brand.id)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm transition-colors duration-200",
                  brandId === brand.id
                    ? "border-ink bg-ink text-paper"
                    : "border-line text-muted hover:border-ink/40",
                )}
              >
                {brand.brand_name}
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-bold">세금계산서</h2>
        <p className="mt-2 text-sm text-muted">
          입력하시면 결제 확인 후 담당자가 발행해 드립니다. (선택)
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="biz" className="block text-sm font-bold">
              사업자등록번호
            </label>
            <input
              id="biz"
              value={bizRegNumber}
              onChange={(e) => setBizRegNumber(e.target.value)}
              placeholder="000-00-00000"
              className="mt-2 w-full rounded-xl border border-line px-4 py-3 text-sm focus:border-ink focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="tax-email" className="block text-sm font-bold">
              발행 이메일
            </label>
            <input
              id="tax-email"
              type="email"
              value={taxEmail}
              onChange={(e) => setTaxEmail(e.target.value)}
              placeholder={`${companyName} 담당자 메일`}
              className="mt-2 w-full rounded-xl border border-line px-4 py-3 text-sm focus:border-ink focus:outline-none"
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold">결제 수단</h2>
        <div id="toss-payment-methods" className="mt-4" />
        <div id="toss-agreement" className="mt-2" />
      </section>

      {/* 정책 동의 — 주문요약 체크박스 2개 (PART E4) */}
      <section className="space-y-3 rounded-2xl border border-line bg-paper-alt p-5">
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={agreePolicy}
            onChange={(e) => setAgreePolicy(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-[var(--color-ink)]"
          />
          <span className="leading-[1.7] text-muted">
            <span className="font-bold text-ink">[필수]</span> {POLICY.noIndividualEdit}
          </span>
        </label>

        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={agreeRefund}
            onChange={(e) => setAgreeRefund(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-[var(--color-ink)]"
          />
          <span className="leading-[1.7] text-muted">
            <span className="font-bold text-ink">[필수]</span>{" "}
            <a
              href="/refund-policy"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              환불규정
            </a>
            을 확인했으며 이에 동의합니다.
          </span>
        </label>
      </section>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-accent/40 bg-accent/[0.07] px-4 py-3 text-sm text-accent-deep"
        >
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full rounded-full bg-ink px-6 py-4 text-sm font-bold text-paper transition-colors duration-200 hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting
          ? "결제창을 여는 중…"
          : `₩${amount.toLocaleString("ko-KR")} 결제하기`}
      </button>
    </div>
  );
}
