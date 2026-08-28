package com.kongdakchaekdak.domain.book;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface BookRepository extends JpaRepository<Book, Long> {

    List<Book> findByUserId(Long userId);

    List<Book> findByStatus(BookStatus status);

    List<Book> findByUserIdAndStatus(Long userId, BookStatus status);

    // 독서 대시보드(Recap) 통계용 — 특정 사용자가 주어진 기간(endDate 기준, 양 끝 포함) 안에
    // 완독 처리한 책 목록. Step 5-1 DashboardService에서 사용.
    List<Book> findByUserIdAndStatusAndEndDateBetween(Long userId, BookStatus status, LocalDate start, LocalDate end);
}
