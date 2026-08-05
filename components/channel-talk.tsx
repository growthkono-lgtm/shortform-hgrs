"use client";

import Script from "next/script";
import { useEffect } from "react";

declare global {
  interface Window {
    ChannelIO?: ((...args: unknown[]) => void) & { q?: unknown[][] };
    ChannelIOInitialized?: boolean;
  }
}

export type ChannelTalkProfile = {
  memberId: string;
  name: string;
  email?: string;
  companyName: string;
  /** 진행 중 프로젝트 — 상담 들어올 때 어느 단계에서 막혔는지 바로 보이게 (F11) */
  activeProjectId?: string;
  activeStage?: string;
};

const PLUGIN_KEY = process.env.NEXT_PUBLIC_CHANNEL_TALK_PLUGIN_KEY;

/**
 * 채널톡 위젯 (PART F11).
 *
 * · pluginKey가 없으면 아무것도 렌더하지 않는다 — 키 발급 전에도 빌드가 깨지지 않게
 * · 런처는 좌하단. 모바일 하단 스티키 CTA와 겹치지 않게 (PART B)
 * · 포털에서는 profile을 넘겨 상담 컨텍스트를 자동으로 붙인다
 */
export function ChannelTalk({ profile }: { profile?: ChannelTalkProfile }) {
  useEffect(() => {
    if (!PLUGIN_KEY || !window.ChannelIO) return;

    window.ChannelIO("boot", {
      pluginKey: PLUGIN_KEY,
      language: "ko",
      // 모바일 스티키 CTA(하단 고정) 위로 런처를 올린다 (PART B)
      mobileMessengerMode: "iframe",
      zIndex: 30,
      ...(profile
        ? {
            memberId: profile.memberId,
            profile: {
              name: profile.name,
              email: profile.email,
              회사명: profile.companyName,
              진행프로젝트: profile.activeProjectId ?? "없음",
              현재단계: profile.activeStage ?? "없음",
            },
          }
        : {}),
    });

    return () => {
      window.ChannelIO?.("shutdown");
    };
  }, [profile]);

  if (!PLUGIN_KEY) return null;

  return (
    <Script id="channel-talk-loader" strategy="afterInteractive">
      {`
        (function(){
          var w=window;
          if(w.ChannelIO){return;}
          var ch=function(){ch.c(arguments);};
          ch.q=[];
          ch.c=function(args){ch.q.push(args);};
          w.ChannelIO=ch;
          function l(){
            if(w.ChannelIOInitialized){return;}
            w.ChannelIOInitialized=true;
            var s=document.createElement("script");
            s.type="text/javascript";
            s.async=true;
            s.src="https://cdn.channel.io/plugin/ch-plugin-web.js";
            var x=document.getElementsByTagName("script")[0];
            if(x.parentNode){x.parentNode.insertBefore(s,x);}
          }
          if(document.readyState==="complete"){l();}
          else{w.addEventListener("DOMContentLoaded",l);w.addEventListener("load",l);}
        })();
      `}
    </Script>
  );
}
