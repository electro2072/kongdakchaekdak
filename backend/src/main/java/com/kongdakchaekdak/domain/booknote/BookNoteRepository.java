package com.kongdakchaekdak.domain.booknote;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface BookNoteRepository extends JpaRepository<BookNote, Long> {

    List<BookNote> findByBookIdOrderByCreatedAtDesc(Long bookId);

    // (G16 회원 탈퇴, 2026-09-11) AccountDeletionService 전용 — 소유 데이터 일괄 삭제.
    @Modifying(flushAutomatically = true)
    @Query("delete from BookNote n where n.book.id in :bookIds")
    int deleteAllByBookIds(@Param("bookIds") Collection<Long> bookIds);
}
