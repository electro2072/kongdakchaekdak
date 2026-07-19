package com.bookflex.domain.book.dto;

import java.time.LocalDate;

/** endDate 를 생략하면 오늘 날짜로 완독 처리된다. */
public record BookCompleteRequest(
        LocalDate endDate
) {
}
