package com.kongdakchaekdak.domain.share.dto;

import com.kongdakchaekdak.domain.share.ShareRecordTarget;
import com.kongdakchaekdak.domain.share.ShareTargetType;

public record ShareTargetResponse(ShareTargetType targetType, Long targetId) {
    public static ShareTargetResponse from(ShareRecordTarget target) {
        return new ShareTargetResponse(target.getTargetType(), target.getTargetId());
    }
}
