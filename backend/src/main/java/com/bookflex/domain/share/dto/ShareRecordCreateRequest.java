package com.bookflex.domain.share.dto;

import com.bookflex.domain.share.SharePlatform;
import com.bookflex.domain.share.ShareScope;
import com.bookflex.domain.share.ShareType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/**
 * shareType=BOOK이면 bookId가 필수 (ShareRecordService에서 교차 검증). shareType=DASHBOARD면
 * bookId는 무시된다. scope=GROUP/CUSTOM이면 targets가 최소 1개 필요, scope=ALL이면 targets는
 * 무시된다. cardImageUrl은 선택 — 클라이언트가 Step4의 S3 presigned URL로 카드 이미지를 이미
 * 직접 업로드했다면 그 URL을 그대로 전달하면 된다 (서버가 카드 이미지를 생성해주지는 않음, Step 5-2에서 다룰 예정).
 */
public record ShareRecordCreateRequest(
        @NotNull ShareType shareType,
        Long bookId,
        @NotNull ShareScope scope,
        @NotNull SharePlatform platform,
        String cardImageUrl,
        @Valid List<ShareTargetRequest> targets
) {
}
