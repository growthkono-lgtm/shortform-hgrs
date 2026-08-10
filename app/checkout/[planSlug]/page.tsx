import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getOptionalProfile } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { getPlanBySlug, formatKRW } from "@/lib/plans";
import { POLICY } from "@/lib/constants";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function CheckoutPage({ params }: PageProps<"/checkout/[planSlug]">) {
  const { planSlug } = await params;

  const plan = await getPlanBySlug(planSlug);
  if (!plan) notFound();

  // 랜딩의 "이 플랜으로 시작하기"가 곧장 이 화면으로 온다.
  // 로그인 전이면 로그인이 아니라 **가입**으로 보낸다 — 처음 오는 사람이 대부분이고,
  // 가입을 마치면 고르던 플랜 결제로 그대로 돌아온다.
  const profile = await getOptionalProfile();
  if (!profile) {
    redirect(`/signup?next=${encodeURIComponent(`/checkout/${planSlug}`)}`);
  }

  const supabase = await createClient();
  const { data: brands } = await supabase
    .from("brand_profiles")
    .select("id, brand_name")
    .order("created_at", { ascending: false });

  const discount = Math.round((1 - plan.beta_price / plan.list_price) * 100);

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-8">
      <Link href="/#pricing" className="text-sm text-muted hover:text-ink">
        ← 플랜 다시 고르기
      </Link>

      <p className="eyebrow mt-8">Checkout</p>
      <h1 className="mt-4 text-3xl font-bold">주문 확인</h1>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        <CheckoutForm
          planSlug={planSlug}
          amount={plan.beta_price}
          customerEmail={null}
          customerName={profile.contact_name}
          companyName={profile.company_name}
          brands={brands ?? []}
        />

        {/* 주문 요약 */}
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <div className="rounded-2xl border border-line bg-paper-alt p-6">
            <h2 className="text-base font-bold">
              {plan.code === "full" ? "패키지 플랜" : "싱글 플랜"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {plan.label} · {plan.composition}
            </p>

            {/* 2026-08-10 가격 확정 이후 정가 = 판매가다. 할인 0%짜리 줄을 그리지 않는다 */}
            <dl className="mt-6 space-y-2 border-t border-line pt-5 text-sm">
              {discount > 0 && (
                <>
                  <div className="flex justify-between text-muted">
                    <dt>정가</dt>
                    <dd className="line-through">{formatKRW(plan.list_price)}</dd>
                  </div>
                  <div className="flex justify-between text-accent-deep">
                    <dt>베타 오픈 할인</dt>
                    <dd>−{discount}%</dd>
                  </div>
                </>
              )}
              <div className="flex justify-between border-t border-line pt-3 text-base font-bold">
                <dt>결제 금액</dt>
                <dd className="stat-figure text-xl">{formatKRW(plan.beta_price)}</dd>
              </div>
            </dl>

            <ul className="mt-6 space-y-2 border-t border-line pt-5 text-xs leading-[1.7] text-muted">
              <li>· {POLICY.revisionOnce}</li>
              <li>· {POLICY.usagePeriod}</li>
              {plan.code === "shorts_only" && <li>· {POLICY.sourceRequired}</li>}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
