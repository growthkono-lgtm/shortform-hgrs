import { redirect } from "next/navigation";
import { SERVICE } from "@/lib/constants";

/**
 * 루트 — 2026-08-11 도메인 이전.
 *
 * hgrs.io 를 프레이머에서 이 앱으로 가져오면서 서비스 라인을 하위 경로로 갈랐다.
 * 루트에 세울 회사 홈은 아직 없으므로 숏폼 스튜디오로 보낸다.
 * 회사 홈이 생기면 이 파일을 그 페이지로 바꾸면 된다 — 그때 이 redirect 를 지운다.
 */
export default function RootPage() {
  redirect(SERVICE.path);
}
