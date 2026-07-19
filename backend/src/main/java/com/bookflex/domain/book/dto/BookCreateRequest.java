package com.bookflex.domain.book.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record BookCreateRequest(
        @NotNull Long userId,
        @NotBlank String title,
        @NotBlank String author,
        String coverImage,
        String isbn,
        String genre,
        Integer totalPages,
        LocalDate startDate
) {
}
