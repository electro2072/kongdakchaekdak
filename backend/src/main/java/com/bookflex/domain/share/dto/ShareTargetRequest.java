package com.bookflex.domain.share.dto;

import com.bookflex.domain.share.ShareTargetType;
import jakarta.validation.constraints.NotNull;

public record ShareTargetRequest(
        @NotNull ShareTargetType targetType,
        @NotNull Long targetId
) {
}
