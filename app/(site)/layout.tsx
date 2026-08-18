import {
  JsonLd,
  organization,
  website,
} from "@/components/seo/structured-data";
import { KakaoConsult } from "@/components/kakao-consult";

/**
 * 공개 사이트 표면.
 *
 * 회사를 드러내는 것 — 구조화 데이터(Organization/WebSite)와 상담 위젯 — 은
 * **여기서만** 붙인다. 루트 레이아웃에 두면 `/work`(작업자 대시보드) 페이지 소스에도
 * 해그로시 JSON-LD 가 그대로 실린다. 화면에 안 보여도 소스에는 남는다.
 */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      {/* 사이트 전역 구조화 데이터 — 생성형 검색이 회사를 식별하는 근거 */}
      <JsonLd data={organization} />
      <JsonLd data={website} />
      {children}
      {/* 공개 페이지 상담 위젯. pluginKey 미설정 시 렌더되지 않는다 (F11) */}
      <KakaoConsult />
    </>
  );
}
