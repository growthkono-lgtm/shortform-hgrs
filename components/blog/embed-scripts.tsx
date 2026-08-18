"use client";

import { useEffect } from "react";

/**
 * 틱톡·인스타 임베드를 실제로 재생시키는 스크립트 로더. (2026-08-15 신설)
 *
 * ── 왜 필요했나 ────────────────────────────────────────────────────────
 * 본문은 `dangerouslySetInnerHTML` 로 들어간다. 그런데 그렇게 삽입된 HTML 안의
 * `<script>` 태그는 **브라우저가 실행하지 않는다**(HTML5 명세). 틱톡·인스타의
 * oEmbed 응답은 `<blockquote>` + `<script src=…embed.js>` 조합이라, 지금까지
 * 스크립트가 한 번도 실행되지 않았다.
 *
 * 그래서 검사식은 "재생되는 자료 1건"으로 세고 있었는데 화면에는 글자 덩어리만
 * 나왔다. 사장님이 "하나만 들어가고 나머진 그냥 링크더라"고 하신 화면이 이거다.
 * 실제로 렌더되던 임베드는 유튜브(iframe)뿐이었다.
 *
 * ── 무엇을 하나 ────────────────────────────────────────────────────────
 * 본문에 해당 blockquote 가 실제로 있을 때만 스크립트를 한 번 붙인다.
 * 글마다 붙는 게 아니라 필요한 글에서만 붙으므로, 임베드가 없는 글은
 * 외부 스크립트를 한 줄도 안 받는다.
 */
const LOADERS = [
  {
    selector: "blockquote.tiktok-embed",
    src: "https://www.tiktok.com/embed.js",
    id: "tiktok-embed-js",
  },
  {
    selector: "blockquote.instagram-media",
    src: "https://www.instagram.com/embed.js",
    id: "instagram-embed-js",
  },
] as const;

export function EmbedScripts() {
  useEffect(() => {
    for (const loader of LOADERS) {
      if (!document.querySelector(loader.selector)) continue;

      const existing = document.getElementById(loader.id);
      if (existing) {
        // 이미 붙어 있으면 다시 훑게만 한다. 라우팅으로 다른 글에 들어왔을 때
        // 스크립트는 남아 있는데 새 blockquote 는 처리가 안 되기 때문이다
        const w = window as unknown as {
          instgrm?: { Embeds?: { process?: () => void } };
        };
        w.instgrm?.Embeds?.process?.();
        continue;
      }

      const script = document.createElement("script");
      script.id = loader.id;
      script.src = loader.src;
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return null;
}
