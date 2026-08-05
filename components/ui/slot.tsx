import { cn } from "@/lib/cn";

/**
 * 자산·데이터 미도착 슬롯 표시자.
 * 실물이 들어오면 이 컴포넌트를 지우고 그 자리에 콘텐츠를 넣는다.
 * 프로덕션 빌드에서도 남아 있으면 눈에 띄어야 하므로 일부러 점선 처리.
 */
export function AssetSlot({
  name,
  ratio = "9/16",
  className,
  hint,
}: {
  name: string;
  ratio?: "9/16" | "16/9" | "1/1" | "4/3";
  className?: string;
  hint?: string;
}) {
  const ratioClass = {
    "9/16": "aspect-[9/16]",
    "16/9": "aspect-video",
    "1/1": "aspect-square",
    "4/3": "aspect-[4/3]",
  }[ratio];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line bg-paper-alt p-4 text-center",
        ratioClass,
        className,
      )}
    >
      <span className="font-display text-[0.6875rem] tracking-[0.02em] text-muted uppercase">
        Asset
      </span>
      <span className="font-mono text-xs break-all text-ink-soft">{name}</span>
      {hint && <span className="text-[0.6875rem] text-muted">{hint}</span>}
    </div>
  );
}

/** 숫자 [DATA] 자리 — 큰 지표 안에 인라인으로 들어감 */
export function DataSlot({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-dashed border-line bg-paper-alt px-2 py-0.5 align-middle font-mono text-xs font-normal tracking-normal text-muted",
        className,
      )}
    >
      {name}
    </span>
  );
}
