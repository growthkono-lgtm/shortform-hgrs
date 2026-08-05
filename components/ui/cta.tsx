import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "solid" | "outline";

const base =
  "inline-flex items-center justify-center rounded-full px-7 py-3.5 text-sm font-bold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const variants: Record<Variant, string> = {
  solid: "bg-ink text-paper hover:bg-ink-soft",
  outline: "border border-ink/20 text-ink hover:border-ink hover:bg-ink/[0.03]",
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
