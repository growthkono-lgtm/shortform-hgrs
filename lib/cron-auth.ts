import "server-only";

import { timingSafeEqual } from "node:crypto";

/**
 * cron 이 부르는 입구의 인증. (2026-08-14)
 *
 * 다섯 라우트가 각자 `header === \`Bearer ${secret}\`` 를 쓰고 있었다.
 * 문자열 `===` 는 첫 글자가 다르면 바로 끝나서, 응답 시간으로 시크릿을
 * 한 글자씩 좁힐 수 있다. 네트워크 너머에서는 어렵지만 막을 이유는 충분하고,
 * `/api/blog/draft` 는 이미 제대로 하고 있었다 — 한쪽만 맞는 게 더 나쁘다.
 *
 * 비교 시간을 값에 의존하지 않게 고정한다.
 */
export function bearerMatches(
  header: string | null,
  secret: string | undefined,
): boolean {
  if (!secret || !header) return false;

  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(header);

  // timingSafeEqual 은 길이가 다르면 던진다. 길이 자체는 비밀이 아니다
  if (expected.length !== given.length) return false;
  return timingSafeEqual(expected, given);
}

/** cron 라우트 공통 가드 */
export function cronAuthorized(request: Request): boolean {
  return bearerMatches(
    request.headers.get("authorization"),
    process.env.CRON_SECRET,
  );
}
