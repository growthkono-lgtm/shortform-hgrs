import { cn } from "@/lib/cn";
import { SEEDING_NONE, stageIndex } from "@/lib/stages";

/**
 * 한 트랙의 단계 목록. 지금 어디까지 왔는지가 이 화면의 전부다 —
 * 지난 단계는 흐리게, 현재 단계는 굵게, 남은 단계는 옅게 두어 세 상태가 한눈에 갈리게 한다.
 *
 * stage가 null이면 그 트랙은 이 플랜에 없다 (싱글 플랜의 인플루언서 시딩) — "해당없음"만 적는다.
 */
export function StageTrack({
  title,
  stages,
  stage,
}: {
  title: string;
  stages: readonly { key: string; label: string }[];
  stage: string | null;
}) {
  const current = stage ? stageIndex(stages, stage) : -1;
  const none = stage === null;

  return (
    <div className="rounded-2xl border border-line bg-paper p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-bold">{title}</h3>
        {none ? (
          <span className="rounded-full bg-paper-alt px-3 py-1 text-xs text-muted">
            {SEEDING_NONE}
          </span>
        ) : (
          <span className="text-xs text-muted">
            {current + 1} / {stages.length}
          </span>
        )}
      </div>

      {none ? (
        <p className="mt-4 text-xs leading-[1.7] text-muted">
          이 플랜에는 인플루언서 시딩이 포함되지 않습니다.
        </p>
      ) : (
        <ol className="mt-5 space-y-0">
          {stages.map((s, i) => {
            const done = i < current;
            const active = i === current;
            const last = i === stages.length - 1;

            return (
              <li key={s.key} className="flex gap-3">
                {/* 점과 선 — 선은 마지막 단계에서 끊는다 */}
                <span className="flex flex-col items-center">
                  <span
                    className={cn(
                      "mt-1 grid size-4 shrink-0 place-items-center rounded-full border transition-colors",
                      active && "border-accent bg-accent",
                      done && "border-accent/40 bg-accent/40",
                      !active && !done && "border-ink/15",
                    )}
                  >
                    {done && (
                      <svg
                        viewBox="0 0 10 10"
                        className="size-2.5 fill-none stroke-white stroke-2"
                        aria-hidden
                      >
                        <path d="M2 5.2l2 2 4-4.4" />
                      </svg>
                    )}
                    {active && (
                      <span className="size-1.5 rounded-full bg-white" />
                    )}
                  </span>
                  {!last && (
                    <span
                      className={cn(
                        "w-px flex-1",
                        done ? "bg-accent/30" : "bg-line",
                      )}
                    />
                  )}
                </span>

                <span className={cn("pb-4 text-sm", last && "pb-0")}>
                  <span
                    className={cn(
                      active && "font-bold text-ink",
                      done && "text-muted",
                      !active && !done && "text-muted/60",
                    )}
                  >
                    {s.label}
                  </span>
                  {active && (
                    <span className="ml-2 align-middle text-[0.6875rem] font-bold text-accent-deep">
                      진행중
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
