package com.bookflex.domain.share.dto;

import com.bookflex.domain.share.SharePlatform;
import com.bookflex.domain.share.ShareRecord;
import com.bookflex.domain.share.ShareScope;
import com.bookflex.domain.share.ShareType;

import java.time.LocalDateTime;
import java.util.List;

public record ShareRecordResponse(
        Long id,
        Long userId,
        Long bookId,
        ShareType shareType,
        ShareScope scope,
        SharePlatform platform,
        String cardImageUrl,
        String publicToken,
        LocalDateTime sharedAt,
        List<ShareTargetResponse> targets
) {
    public static ShareRecordResponse from(ShareRecord record, List<ShareTargetResponse> targets) {
        return new ShareRecordResponse(
                record.getId(),
                record.getUser().getId(),
                record.getBook() == null ? null : record.getBook().getId(),
                record.getShareType(),
                record.getScope(),
                record.getPlatform(),
                record.getCardImageUrl(),
                record.getPublicToken(),
                record.getSharedAt(),
                targets
        );
    }
}
