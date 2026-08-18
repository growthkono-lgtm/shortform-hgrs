import { KAKAO_CHANNEL } from "@/lib/constants";

/**
 * 카카오톡 상담 버튼 — 우측 하단 고정. (2026-08-14)
 *
 * ── 채널톡을 걷어낸 이유 ───────────────────────────────────────────────
 * 채널톡은 위젯을 띄우려면 플러그인 키가 있어야 하고, 상담이 들어와도
 * 그 창을 우리가 계속 지켜야 한다. 사장님 판단: **카카오 친구채널로 받는다.**
 * 브랜드 담당자는 이미 카카오를 하루 종일 켜 두고 있고, 우리도 알림을 폰으로
 * 받는다. 새 도구를 하나 더 여는 것보다 이미 열려 있는 창으로 받는 게 싸다.
 *
 * ── 왜 스크립트가 아니라 링크인가 ────────────────────────────────────
 * 카카오 채널은 SDK 없이 **주소 하나로 열린다.** 자바스크립트를 한 줄도 안
 * 실으므로 페이지가 느려지지 않고, 광고 차단기에도 안 걸리고, 서버 렌더만으로
 * 끝난다. 클라이언트 컴포넌트일 이유가 없다.
 *
 * ⚠️ 모바일 하단 스티키 CTA와 겹치지 않게 `bottom` 을 넉넉히 띄운다.
 */
export function KakaoConsult() {
  return (
    <a
      href={KAKAO_CHANNEL.chatUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="카카오톡으로 상담하기"
      className="fixed right-4 bottom-24 z-30 flex items-center gap-2 rounded-full bg-[#FEE500] px-4 py-3 shadow-[0_4px_16px_rgba(0,0,0,0.16)] transition-transform hover:scale-105 sm:right-6 sm:bottom-10"
    >
      {/* 카카오 말풍선 — 브랜드 심볼이라 형태를 바꾸지 않는다 */}
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="size-6 shrink-0 fill-[#3C1E1E]"
      >
        <path d="M12 3C6.9 3 2.8 6.3 2.8 10.3c0 2.6 1.7 4.9 4.3 6.2-.2.7-.7 2.5-.8 2.9 0 0-.1.2.1.3.1.1.3 0 .3 0 .4-.1 2.6-1.7 3.5-2.4.6.1 1.2.1 1.8.1 5.1 0 9.2-3.3 9.2-7.3S17.1 3 12 3z" />
      </svg>
      <span className="text-sm font-bold text-[#3C1E1E]">상담하기</span>
    </a>
  );
}
