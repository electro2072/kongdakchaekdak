package com.bookflex.domain.dashboard.dto;

/** days는 시작일~종료일을 양 끝 포함해서 센 일수 (예: 06.20~06.28 = 9일, 화면설계서 서재 탭 표기와 동일한 방식). */
public record BookHighlightDto(
        Long bookId,
        String title,
        long days
) {
}
