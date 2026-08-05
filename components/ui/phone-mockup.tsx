import { cn } from "@/lib/cn";
import { AssetSlot } from "./slot";

/**
 * 9:16 폰 목업 — S5·S7 공용 (PART B).
 * src가 없으면 자산 슬롯을 그대로 보여준다.
 */
export function PhoneMockup({
  src,
  poster,
  slotName,
  className,
}: {
  src?: string | null;
  poster?: string | null;
  slotName: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[260px] rounded-[2rem] border border-line bg-paper p-2 shadow-[0_18px_50px_-20px_rgba(3,3,3,0.25)]",
        className,
      )}
    >
      <div className="overflow-hidden rounded-[1.5rem] bg-paper-alt">
        {src ? (
          <video
            className="aspect-[9/16] w-full object-cover"
            src={src}
            poster={poster ?? undefined}
            muted
            loop
            playsInline
            autoPlay
            controlsList="nodownload"
          />
        ) : (
          <AssetSlot name={slotName} ratio="9/16" className="rounded-none border-0" />
        )}
      </div>
    </div>
  );
}
