package com.bookflex.domain.share.dto;

import com.bookflex.domain.share.ShareRecordTarget;
import com.bookflex.domain.share.ShareTargetType;

public record ShareTargetResponse(ShareTargetType targetType, Long targetId) {
    public static ShareTargetResponse from(ShareRecordTarget target) {
        return new ShareTargetResponse(target.getTargetType(), target.getTargetId());
    }
}
