package com.kongdakchaekdak.domain.booknote.dto;

import jakarta.validation.constraints.NotBlank;

public record BookNoteUpdateRequest(@NotBlank String content) {
}
