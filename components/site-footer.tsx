import Link from "next/link";
import { COMPANY, PARTNERSHIP_URL, SERVICE } from "@/lib/constants";

/** PG 심사 요건 — 확정 전까지 어떤 항목이 비었는지 개발 화면에서 보이게 둔다 */
const REQUIRED_FIELDS = [
  { label: "대표자", value: COMPANY.ceoName },
  { label: "유선번호", value: COMPANY.phone },
  { label: "통신판매업 신고번호", value: COMPANY.mailOrderNumber },
  { label: "개인정보관리책임자", value: COMPANY.privacyOfficer },
] as const;

export function SiteFooter() {
  const missing = REQUIRED_FIELDS.filter((field) => !field.value);

  return (
    <footer className="mt-auto border-t border-line px-5 py-14 sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <Link href="/terms" className="text-muted hover:text-ink">
            이용약관
          </Link>
          <Link href="/privacy" className="font-bold text-ink-soft hover:text-ink">
            개인정보처리방침
          </Link>
          <Link href="/refund-policy" className="text-muted hover:text-ink">
            환불규정
          </Link>
          {/* 헤더에서 뺀 링크다 — 끝까지 읽고도 종합 대행이 필요한 사람만 여기서 넘어간다 */}
          <a
            href={PARTNERSHIP_URL}
            target="_blank"
            rel="noreferrer"
            className="font-bold text-ink-soft hover:text-ink"
          >
            파트너십 문의
          </a>
          <a
            href={SERVICE.parentUrl}
            target="_blank"
            rel="noreferrer"
            className="text-muted hover:text-ink"
          >
            hgrs.io
          </a>
          <a
            href={SERVICE.instagram}
            target="_blank"
            rel="noreferrer"
            className="text-muted hover:text-ink"
          >
            @hgrs.io
          </a>
        </div>

        <dl className="mt-8 space-y-1.5 text-xs leading-[1.7] text-muted">
          <div className="flex flex-wrap gap-x-2">
            <dt className="sr-only">상호</dt>
            <dd className="font-bold text-ink-soft">{COMPANY.name}</dd>
          </div>
          <div className="flex flex-wrap gap-x-2">
            <dt>사업자등록번호</dt>
            <dd>{COMPANY.bizRegNumber}</dd>
          </div>
          <div className="flex flex-wrap gap-x-2">
            <dt>주소</dt>
            <dd>
              {COMPANY.address} ({COMPANY.addressLabel})
            </dd>
          </div>
          {REQUIRED_FIELDS.filter((field) => field.value).map((field) => (
            <div key={field.label} className="flex flex-wrap gap-x-2">
              <dt>{field.label}</dt>
              <dd>{field.value}</dd>
            </div>
          ))}
          <div className="flex flex-wrap gap-x-2">
            <dt>호스팅 제공</dt>
            <dd>{COMPANY.hostingProvider}</dd>
          </div>
        </dl>

        {missing.length > 0 && process.env.NODE_ENV !== "production" && (
          <p className="mt-6 rounded-lg border border-dashed border-accent/50 bg-accent/[0.06] px-4 py-3 font-mono text-xs text-accent-deep">
            PG 심사 요건 미입력: {missing.map((f) => f.label).join(" · ")} —
            lib/constants.ts COMPANY
          </p>
        )}

        <p className="mt-8 text-xs text-muted">
          © {new Date().getFullYear()} {COMPANY.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
