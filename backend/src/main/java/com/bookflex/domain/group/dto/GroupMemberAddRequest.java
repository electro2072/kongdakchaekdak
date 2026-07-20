package com.bookflex.domain.group.dto;

import jakarta.validation.constraints.NotNull;

public record GroupMemberAddRequest(@NotNull Long userId) {
}
