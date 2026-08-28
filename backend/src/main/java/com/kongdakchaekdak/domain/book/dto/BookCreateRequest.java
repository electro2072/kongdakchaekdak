package com.kongdakchaekdak.domain.book.dto;

import com.kongdakchaekdak.domain.common.Genre;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record BookCreateRequest(
        @NotNull Long userId,
        @NotBlank String title,
        @NotBlank String author,
        String coverImage,
        String isbn,
        Genre genre,
        Integer totalPages,
        LocalDate startDate
) {
}
