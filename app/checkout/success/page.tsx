import Link from "next/link";
import type { Metadata } from "next";
import { requireProfile } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { formatKRW } from "@/lib/plans";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function CheckoutSuccessPage({
  searchParams,
}: PageProps<"/checkout/success">) {
  await requireProfile();
  const { order: orderId, pending } = await searchParams;

  const supabase = await createClient();
  const { data: order } =
    typeof orderId === "string"
      ? await supabase
          .from("orders")
          .select("id, amount, status, plans(label, code, composition)")
          .eq("id", orderId)
          .maybeSingle()
      : { data: null };

  const { data: project } =
    typeof orderId === "string"
      ? await supabase
          .from("projects")
          .select("id")
          .eq("order_id", orderId)
          .maybeSingle()
      : { data: null };

  const isVbank = pending === "vbank";

  return (
    <div className="mx-auto w-full max-w-lg px-5 py-20 text-center sm:px-8">
      <p className="eyebrow">{isVbank ? "Awaiting Deposit" : "Payment Complete"}</p>

      <h1 className="mt-5 text-3xl font-bold">
        {isVbank ? "입금을 기다리고 있습니다" : "결제가 완료되었습니다"}
      </h1>

      <p className="mt-5 text-sm leading-[1.8] text-muted">
        {isVbank ? (
          <>
            발급된 가상계좌로 입금이 확인되면 프로젝트가 자동으로 시작됩니다. 입금
            정보는 결제 완료 안내 메일에서 확인하실 수 있습니다.
          </>
        ) : (
          <>
            담당자가 배정되면 안내 메일을 보내드립니다. 대시보드에서 진행 상황을 단계별로
            확인하실 수 있습니다.
          </>
        )}
      </p>

      {order?.plans && (
        <dl className="mt-10 space-y-2 rounded-2xl border border-line bg-paper-alt p-6 text-left text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">플랜</dt>
            <dd className="font-bold">
              {order.plans.code === "full" ? "풀 파이프라인" : "전환 숏폼 단독"}{" "}
              {order.plans.label}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">구성</dt>
            <dd>{order.plans.composition}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-3">
            <dt className="text-muted">결제 금액</dt>
            <dd className="font-bold">{formatKRW(order.amount)}</dd>
          </div>
        </dl>
      )}

      <div className="mt-10 flex flex-col gap-3">
        <Link
          href={project ? `/app/projects/${project.id}` : "/app"}
          className="rounded-full bg-ink px-6 py-3.5 text-sm font-bold text-paper"
        >
          {project ? "진행 상황 보기" : "내 프로젝트로"}
        </Link>
      </div>
    </div>
  );
}
