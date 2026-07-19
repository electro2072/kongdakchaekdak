package com.bookflex.domain.book;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookRepository extends JpaRepository<Book, Long> {

    List<Book> findByUserId(Long userId);

    List<Book> findByStatus(BookStatus status);

    List<Book> findByUserIdAndStatus(Long userId, BookStatus status);
}
