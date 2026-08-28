package com.kongdakchaekdak.domain.dashboard.dto;

/**
 * 기획서 3-6-1 "하이라이트 카드" — 가장 많이 읽은 장르, 최장 완독 기간 책, 가장 빨리 읽은 책.
 * 해당 기간에 완독한 책이 없으면 전부 null. 완독한 책이 1권뿐이면 longestReadBook과
 * fastestReadBook이 같은 책을 가리킬 수 있다(당연한 결과).
 */
public record DashboardHighlights(
        String topGenre,
        BookHighlightDto longestReadBook,
        BookHighlightDto fastestReadBook
) {
}
