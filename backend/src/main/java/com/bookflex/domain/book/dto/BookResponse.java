package com.bookflex.domain.book.dto;

import com.bookflex.domain.book.Book;
import com.bookflex.domain.book.BookStatus;
import com.bookflex.domain.common.Genre;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record BookResponse(
        Long id,
        Long userId,
        String title,
        String author,
        String coverImage,
        String isbn,
        Genre genre,
        Integer totalPages,
        BookStatus status,
        LocalDate startDate,
        LocalDate endDate,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static BookResponse from(Book book) {
        return new BookResponse(
                book.getId(),
                book.getUser().getId(),
                book.getTitle(),
                book.getAuthor(),
                book.getCoverImage(),
                book.getIsbn(),
                book.getGenre(),
                book.getTotalPages(),
                book.getStatus(),
                book.getStartDate(),
                book.getEndDate(),
                book.getCreatedAt(),
                book.getUpdatedAt()
        );
    }
}
