package com.kongdakchaekdak.domain.booknote;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookNoteRepository extends JpaRepository<BookNote, Long> {

    List<BookNote> findByBookIdOrderByCreatedAtDesc(Long bookId);
}
