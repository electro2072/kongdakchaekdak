package com.bookflex.domain.book.dto;

import com.bookflex.domain.common.Genre;

public record BookUpdateRequest(
        String title,
        String author,
        String coverImage,
        String isbn,
        Genre genre,
        Integer totalPages
) {
}
