import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * cn()은 단순 join이라 className 으로 색을 덮어쓸 수 없다 (충돌 클래스가 둘 다 남고
 * CSS 정의 순서가 이긴다 — 흰 배경에 흰 글씨가 났다). 다크 위에 얹는 조합은
 * 클래스 오버라이드가 아니라 **여기 변형으로 추가**한다.
 */
type Variant = "solid" | "outline" | "invert" | "outlineLight";

const base =
  "inline-flex items-center justify-center rounded-full px-7 py-3.5 text-sm font-bold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const variants: Record<Variant, string> = {
  solid: "bg-ink text-paper hover:bg-ink-soft",
  outline: "border border-ink/20 text-ink hover:border-ink hover:bg-ink/[0.03]",
  invert: "bg-paper text-ink hover:bg-paper/85",
  outlineLight:
    "border border-white/25 text-white hover:border-white hover:bg-white/10",
};

export function Cta({
  href,
  variant = "solid",
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={cn(base, variants[variant], className)}>
      {children}
    </Link>
  );
}
