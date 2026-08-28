package com.kongdakchaekdak.domain.group.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GroupCreateRequest(@NotBlank @Size(max = 50) String name) {
}
