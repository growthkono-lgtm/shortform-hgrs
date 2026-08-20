import { Fragment } from "react";

/**
 * 가운뎃점(·)이 줄머리로 떨어지는 것을 막는다. (2026-08-20)
 *
 * 왜 필요한가: `app/globals.css` 가 `word-break: keep-all` 을 전역으로 걸어
 * 한글 어절은 잘 지키는데, **가운뎃점 U+00B7 은 한글이 아니라서 keep-all 의
 * 보호를 못 받는다.** 유니코드 줄바꿈 규칙(UAX#14)이 이 글자를 한중일 문맥에서
 * 표의문자처럼 다뤄 앞뒤 모두 끊을 수 있는 자리로 본다. 그래서 이런 게 나온다:
 *
 *     ... 기획·촬영·편집·모션
 *     ·퍼포먼스가 각자 담당으로 ...
 *
 * CSS 로는 특정 글자만 골라 막을 방법이 없어서 조판 단계에서 묶는다.
 * `기획·촬영` 처럼 점으로 이어진 덩어리를 통째로 `whitespace-nowrap` 으로 싼다.
 *
 * **글자를 바꾸지 않는다.** 넣지도 빼지도 않고 감싸기만 하므로 화면에 나오는
 * 문장은 원문 그대로다. 구조화 데이터(FAQPage 등)에는 원본 문자열을 그대로
 * 쓰면 되고 — 이 컴포넌트는 눈에 보이는 쪽에만 관여한다.
 *
 * 너무 긴 사슬은 묶지 않는다. 좁은 화면에서 통째로 안 들어가면 오히려
 * 가로로 삐져나가기 때문이다({@link MAX_RUN} 글자까지만).
 */

/** 이 길이를 넘는 점 사슬은 묶지 않는다 — 320px 에서도 한 줄에 들어갈 만큼만 */
const MAX_RUN = 18;

/** 점으로 이어진 덩어리: `한글·한글`, `기획·촬영·편집` … */
const DOT_RUN = /[^\s·]+(?:·[^\s·]+)+/g;

export function KeepDots({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;

  for (const m of text.matchAll(DOT_RUN)) {
    const run = m[0];
    const at = m.index;
    if (run.length > MAX_RUN) continue; // 너무 길면 그냥 둔다
    if (at > last) parts.push(text.slice(last, at));
    parts.push(
      <span key={`${at}-${run}`} className="whitespace-nowrap">
        {run}
      </span>,
    );
    last = at + run.length;
  }

  if (parts.length === 0) return <>{text}</>;
  if (last < text.length) parts.push(text.slice(last));

  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>{p}</Fragment>
      ))}
    </>
  );
}
