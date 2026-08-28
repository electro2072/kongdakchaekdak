package com.kongdakchaekdak.domain.share.dto;

import com.kongdakchaekdak.domain.share.ShareTargetType;
import jakarta.validation.constraints.NotNull;

public record ShareTargetRequest(
        @NotNull ShareTargetType targetType,
        @NotNull Long targetId
) {
}
