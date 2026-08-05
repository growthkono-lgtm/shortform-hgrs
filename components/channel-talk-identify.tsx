"use client";

import { useEffect } from "react";
import type { ChannelTalkProfile } from "./channel-talk";

/**
 * 포털에서 로그인 사용자 정보를 채널톡 프로필에 붙인다 (PART F11).
 *
 * 루트 레이아웃에서 이미 boot()가 끝났으므로 여기서는 updateUser만 부른다 —
 * 중복 boot는 위젯을 다시 그린다.
 */
export function ChannelTalkIdentify({ profile }: { profile: ChannelTalkProfile }) {
  useEffect(() => {
    if (!window.ChannelIO) return;

    window.ChannelIO("updateUser", {
      profile: {
        name: profile.name,
        email: profile.email,
        회사명: profile.companyName,
        진행프로젝트: profile.activeProjectId ?? "없음",
        현재단계: profile.activeStage ?? "없음",
      },
    });
  }, [profile]);

  return null;
}
