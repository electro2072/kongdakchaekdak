package com.bookflex.domain.book.dto;

public record BookUpdateRequest(
        String title,
        String author,
        String coverImage,
        String isbn,
        String genre,
        Integer totalPages
) {
}
