import { cn } from "@/lib/cn";

type SectionProps = {
  id?: string;
  /** 영문 아이브로우 레이블 — 섹션마다 필수 (PART B) */
  eyebrow: string;
  alt?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function Section({ id, eyebrow, alt, className, children }: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-16 px-5 py-16 sm:px-8 sm:py-20 md:py-28 lg:py-(--spacing-section)",
        alt && "bg-paper-alt",
        className,
      )}
    >
      <div className="mx-auto w-full max-w-6xl">
        <p className="eyebrow mb-5">{eyebrow}</p>
        {children}
      </div>
    </section>
  );
}

/** 섹션 헤드라인 — **강조**를 accent 없이 굵기로만 처리 (절제된 톤) */
export function SectionHeading({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "max-w-3xl text-[1.5rem] leading-[1.35] font-bold sm:text-[2.125rem] sm:leading-[1.3] lg:text-[2.75rem]",
        className,
      )}
    >
      {children}
    </h2>
  );
}

export function SectionLede({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 max-w-2xl text-[0.9375rem] leading-[1.8] text-muted sm:mt-5 sm:text-lg">
      {children}
    </p>
  );
}
