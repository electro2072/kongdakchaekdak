package com.kongdakchaekdak.domain.group.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GroupUpdateRequest(@NotBlank @Size(max = 50) String name) {
}
