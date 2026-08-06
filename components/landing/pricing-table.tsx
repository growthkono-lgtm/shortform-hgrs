import { formatKRW } from "@/lib/constants";

/**
 * 피그마 요금표 기반. 단, 사장님 지시로 **인플루언서 시딩 단가는 노출하지 않는다** —
 * 시딩과 숏폼 부스팅을 합친 금액 하나만 보여주고 수량만 각각 밝힌다.
 * (단가를 쪼개 보여주면 항목별로 값을 깎는 협상이 들어온다.)
 *
 * 모바일에서는 표를 가로로 밀어야 했다. 5열 표를 좁은 화면에 밀어 넣으면 어떤 폭을
 * 줘도 넘친다. 그래서 **모바일은 카드로, 태블릿부터 표로** 갈아 끼운다.
 *
 * 금액을 고칠 일이 생기면 여기가 아니라 lib/constants.ts 의 PLANS 를 고칠 것 —
 * 결제는 서버에서 plans 기준으로 재검증한다.
 */

type Row = {
  label: string;
  seedingQty: number;
  shortsQty: number;
  total: number;
  recommended?: boolean;
};

const ROWS: Row[] = [
  { label: "스타터", seedingQty: 10, shortsQty: 5, total: 1_350_000 },
  { label: "그로스", seedingQty: 20, shortsQty: 10, total: 2_200_000, recommended: true },
  { label: "스케일", seedingQty: 30, shortsQty: 20, total: 2_840_000 },
];

function RecommendBadge() {
  return (
    <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-[0.625rem] font-bold text-white">
      추천
    </span>
  );
}

export function PricingTable() {
  return (
    <>
      {/* ── 모바일: 카드 ── */}
      <div className="mt-8 space-y-3 sm:hidden">
        {ROWS.map((r) => (
          <div
            key={r.label}
            className={`rounded-2xl border p-5 ${
              r.recommended ? "border-accent bg-accent/[0.06]" : "border-line bg-paper"
            }`}
          >
            <p className="flex items-center text-base font-bold">
              {r.label}
              {r.recommended && <RecommendBadge />}
            </p>

            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted">인플루언서 바이럴 시딩</dt>
                <dd className="font-bold tabular-nums">{r.seedingQty}건</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted">구매전환 숏폼 부스팅</dt>
                <dd className="font-bold tabular-nums">{r.shortsQty}편</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3 border-t border-line pt-2">
                <dt className="text-muted">총 수량</dt>
                <dd className="font-bold tabular-nums">
                  {r.seedingQty + r.shortsQty}
                </dd>
              </div>
            </dl>

            <p className="mt-4 flex items-baseline justify-between gap-3 border-t border-line pt-4">
              <span className="text-sm text-muted">총 금액</span>
              <span className="stat-figure text-xl text-accent-deep tabular-nums">
                {formatKRW(r.total)}
              </span>
            </p>
          </div>
        ))}
      </div>

      {/* ── 태블릿 이상: 표 ── */}
      <div className="mt-10 hidden sm:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-night text-white">
              <th className="border border-white/15 px-4 py-3.5 font-bold">구분</th>
              <th className="border border-white/15 px-4 py-3.5 font-bold">
                인플루언서 바이럴 시딩
                <span className="mt-0.5 block text-xs font-normal text-white/55">
                  수량
                </span>
              </th>
              <th className="border border-white/15 px-4 py-3.5 font-bold">
                구매전환 숏폼 기획제작 부스팅
                <span className="mt-0.5 block text-xs font-normal text-white/55">
                  수량
                </span>
              </th>
              <th className="border border-white/15 px-4 py-3.5 font-bold">총 수량</th>
              <th className="border border-white/15 px-4 py-3.5 font-bold">총 금액</th>
            </tr>
          </thead>

          <tbody>
            {ROWS.map((r) => (
              <tr
                key={r.label}
                className={
                  r.recommended
                    ? "bg-accent/[0.07] font-bold text-ink"
                    : "bg-paper text-ink-soft"
                }
              >
                <th className="border border-line px-4 py-4 text-left font-bold whitespace-nowrap">
                  {r.label}
                  {r.recommended && <RecommendBadge />}
                </th>
                <td className="border border-line px-4 py-4 text-center tabular-nums">
                  {r.seedingQty}
                </td>
                <td className="border border-line px-4 py-4 text-center tabular-nums">
                  {r.shortsQty}
                </td>
                <td className="border border-line px-4 py-4 text-center tabular-nums">
                  {r.seedingQty + r.shortsQty}
                </td>
                <td
                  className={`border border-line px-4 py-4 text-center text-base font-bold tabular-nums ${
                    r.recommended ? "text-accent-deep" : ""
                  }`}
                >
                  {formatKRW(r.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
