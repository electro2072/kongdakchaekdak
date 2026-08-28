package com.kongdakchaekdak.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * app.public-web.* 값을 바인딩한다 (Step 5-2: 비로그인 공개 공유 웹뷰).
 *
 * <p>baseUrl: OG 메타태그의 og:url, 그리고 상대경로뿐인 이미지 URL을 절대경로로 만들 때 쓰는
 * 이 서버의 공개 도메인. 실제 배포(Step 6) 후 PUBLIC_BASE_URL 환경변수로 교체해야 한다.</p>
 *
 * <p>defaultOgImageUrl: 공유 카드 이미지(cardImageUrl)도, 책 표지도 없을 때 쓸 고정 OG 이미지.
 * 아직 디자인 에셋이 준비되지 않아 기본값은 빈 문자열 — 비어 있으면 og:image 태그 자체를
 * 생략하도록 템플릿에서 처리한다.</p>
 */
@ConfigurationProperties(prefix = "app.public-web")
public record PublicWebProperties(String baseUrl, String defaultOgImageUrl) {
}
