import { formatKRW } from "@/lib/constants";

/**
 * 피그마 요금표 기반. 단, 사장님 지시로 **인플루언서 시딩 단가는 노출하지 않는다** —
 * 시딩과 숏폼 부스팅을 합친 금액 하나만 보여주고 수량만 각각 밝힌다.
 * (단가를 쪼개 보여주면 항목별로 값을 깎는 협상이 들어온다.)
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

export function PricingTable() {
  return (
    // 좁은 화면에서는 표가 통째로 가로 스크롤된다 — 칸을 줄이면 숫자 비교가 안 된다
    <div className="-mx-5 mt-10 overflow-x-auto px-5 sm:mx-0 sm:px-0">
      <table className="w-full min-w-[640px] border-collapse text-sm">
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
                {r.recommended && (
                  <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-[0.625rem] font-bold text-white">
                    추천
                  </span>
                )}
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
  );
}
