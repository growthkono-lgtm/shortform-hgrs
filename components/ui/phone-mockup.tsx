import Image from "next/image";
import { cn } from "@/lib/cn";
import { AssetSlot } from "./slot";
import { LoopVideo } from "./loop-video";

/**
 * 9:16 폰 목업 — S5·S7 공용 (PART B).
 *
 * 영상(src)이 있으면 재생하고, 스틸(poster)만 있으면 이미지로 보여준다.
 * 둘 다 없으면 자산 슬롯을 그대로 노출해 교체 지점을 드러낸다.
 */
export function PhoneMockup({
  src,
  poster,
  alt,
  slotName,
  className,
  priority,
}: {
  src?: string | null;
  poster?: string | null;
  alt?: string;
  slotName: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[260px] rounded-[2rem] border border-line bg-paper p-2 shadow-[0_18px_50px_-20px_rgba(3,3,3,0.25)]",
        className,
      )}
    >
      <div className="relative aspect-[9/16] overflow-hidden rounded-[1.5rem] bg-paper-alt">
        {src && poster ? (
          <LoopVideo src={src} poster={poster} alt={alt} />
        ) : poster ? (
          <Image
            src={poster}
            alt={alt ?? ""}
            fill
            sizes="260px"
            priority={priority}
            className="object-cover"
          />
        ) : (
          <AssetSlot
            name={slotName}
            ratio="9/16"
            className="h-full rounded-none border-0"
          />
        )}
      </div>
    </div>
  );
}
