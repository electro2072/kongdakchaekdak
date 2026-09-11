package com.kongdakchaekdak.domain.book;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface BookRepository extends JpaRepository<Book, Long> {

    List<Book> findByUserId(Long userId);

    List<Book> findByStatus(BookStatus status);

    List<Book> findByUserIdAndStatus(Long userId, BookStatus status);

    // 독서 대시보드(Recap) 통계용 — 특정 사용자가 주어진 기간(endDate 기준, 양 끝 포함) 안에
    // 완독 처리한 책 목록. Step 5-1 DashboardService에서 사용.
    List<Book> findByUserIdAndStatusAndEndDateBetween(Long userId, BookStatus status, LocalDate start, LocalDate end);

    // (G16 회원 탈퇴, 2026-09-11) AccountDeletionService 전용 — 소유 데이터 일괄 삭제.
    @Query("select b.id from Book b where b.user.id = :userId")
    List<Long> findIdsByUserId(@Param("userId") Long userId);

    @Modifying(flushAutomatically = true)
    @Query("delete from Book b where b.user.id = :userId")
    int deleteAllOwnedBy(@Param("userId") Long userId);
}
