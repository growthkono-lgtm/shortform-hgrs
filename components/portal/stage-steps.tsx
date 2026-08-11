import { cn } from "@/lib/cn";
import { stageIndex } from "@/lib/stages";

/**
 * 진행 단계 — 큰 원형 1·2·3·4가 화살표로 오른쪽으로 넘어간다.
 *
 * 세로 목록으로 두었더니 "지금 어디"가 한눈에 안 들어왔다. 원형 번호 + 화살표는
 * 남은 칸이 몇 개인지까지 같이 읽힌다. 좁은 화면에서는 가로 스크롤로 흘린다 —
 * 줄바꿈으로 접으면 화살표 방향이 꺾여 진행이 거꾸로 읽힌다.
 */
export function StageSteps({
  stages,
  stage,
}: {
  stages: readonly { key: string; label: string }[];
  stage: string;
}) {
  const current = stageIndex(stages, stage);

  return (
    <ol className="-mx-1 flex min-w-0 items-start justify-start gap-0.5 overflow-x-auto px-1 pb-2 sm:gap-1">
      {stages.map((s, i) => {
        const done = i < current;
        const active = i === current;
        const last = i === stages.length - 1;

        return (
          <li key={s.key} className="flex shrink-0 items-start gap-1">
            <div className="flex w-[80px] flex-col items-center gap-2 sm:w-[96px]">
              <span
                className={cn(
                  "grid size-12 shrink-0 place-items-center rounded-full border-2 text-base font-bold transition-colors sm:size-14 sm:text-lg",
                  active && "border-accent bg-accent text-white",
                  done && "border-accent/35 bg-accent/10 text-accent-deep",
                  !active && !done && "border-line bg-paper text-muted/60",
                )}
              >
                {done ? (
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden
                    className="size-5 fill-none stroke-current stroke-[2.5]"
                  >
                    <path
                      d="M5 13l4 4L19 7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={cn(
                  "text-center text-[0.6875rem] leading-[1.45] break-keep sm:text-xs",
                  active && "font-bold text-ink",
                  done && "text-muted",
                  !active && !done && "text-muted/50",
                )}
              >
                {s.label}
              </span>
              {active && (
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[0.625rem] font-bold text-accent-deep">
                  진행중
                </span>
              )}
            </div>

            {!last && (
              <svg
                viewBox="0 0 24 24"
                aria-hidden
                className={cn(
                  "mt-4 size-4 shrink-0 fill-none stroke-2 sm:mt-5 sm:size-5",
                  done ? "stroke-accent/45" : "stroke-line",
                )}
              >
                <path
                  d="M9 6l6 6-6 6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </li>
        );
      })}
    </ol>
  );
}
