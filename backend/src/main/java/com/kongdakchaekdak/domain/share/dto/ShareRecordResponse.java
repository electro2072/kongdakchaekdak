package com.kongdakchaekdak.domain.share.dto;

import com.kongdakchaekdak.domain.share.SharePlatform;
import com.kongdakchaekdak.domain.share.ShareRecord;
import com.kongdakchaekdak.domain.share.ShareScope;
import com.kongdakchaekdak.domain.share.ShareType;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Step 5-2에서 note/photos/dashboardSnapshot 3개 필드가 추가됨 — 전부 해당 없으면 null(또는
 * 빈 리스트). 클라이언트가 공유 실행 전 카드 미리보기를 만들 때 그대로 활용할 수 있다.
 */
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
        List<ShareTargetResponse> targets,
        ShareRecordNoteResponse note,
        List<ShareRecordPhotoResponse> photos,
        DashboardSnapshotResponse dashboardSnapshot
) {
    public static ShareRecordResponse from(ShareRecord record, List<ShareTargetResponse> targets,
                                            ShareRecordNoteResponse note, List<ShareRecordPhotoResponse> photos,
                                            DashboardSnapshotResponse dashboardSnapshot) {
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
                targets,
                note,
                photos,
                dashboardSnapshot
        );
    }
}
