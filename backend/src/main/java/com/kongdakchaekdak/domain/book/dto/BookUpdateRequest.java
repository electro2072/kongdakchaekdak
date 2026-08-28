package com.kongdakchaekdak.domain.book.dto;

import com.kongdakchaekdak.domain.common.Genre;

public record BookUpdateRequest(
        String title,
        String author,
        String coverImage,
        String isbn,
        Genre genre,
        Integer totalPages
) {
}
