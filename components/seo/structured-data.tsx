import { ORG, SERVICE } from "@/lib/constants";

/**
 * 구조화 데이터(JSON-LD).
 *
 * 검색엔진뿐 아니라 **생성형 검색(AEO)** 이 인용할 때 쓰는 재료다.
 * 화면에 보이지 않는 값을 지어내지 않는다 — 페이지에 실제로 쓰여 있는 사실만 담는다.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // 구조화 데이터는 우리가 만든 정적 문자열이라 XSS 경로가 아니다
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export const organization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SERVICE.url}#organization`,
  name: ORG.name,
  alternateName: ORG.nameEn,
  url: SERVICE.url,
  email: ORG.email,
  description: ORG.description,
  sameAs: [...ORG.sameAs],
};

export const website = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SERVICE.url}#website`,
  url: SERVICE.url,
  name: ORG.name,
  inLanguage: "ko-KR",
  publisher: { "@id": `${SERVICE.url}#organization` },
};

/** 서비스 페이지 하나를 설명한다 */
export function serviceSchema({
  path,
  name,
  description,
  serviceType,
}: {
  path: string;
  name: string;
  description: string;
  serviceType: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${SERVICE.url}${path}#service`,
    name,
    description,
    serviceType,
    url: `${SERVICE.url}${path}`,
    provider: { "@id": `${SERVICE.url}#organization` },
    areaServed: { "@type": "Country", name: "대한민국" },
    audience: {
      "@type": "BusinessAudience",
      audienceType: "브랜드 · 스타트업 마케팅 담당",
    },
  };
}

export function breadcrumb(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SERVICE.url}${item.path}`,
    })),
  };
}

export function faqSchema(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };
}
