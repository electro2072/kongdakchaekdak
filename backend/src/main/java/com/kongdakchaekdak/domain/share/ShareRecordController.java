package com.kongdakchaekdak.domain.share;

import com.kongdakchaekdak.domain.share.dto.ShareRecordCreateRequest;
import com.kongdakchaekdak.domain.share.dto.ShareRecordResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 공유 기록(ShareRecord) API (Step 5, 기록 전용 범위 — 사용자 결정에 따라 카드 이미지 생성/
 * 공개 웹뷰는 다음 단계(Step 5-2)로 미룸). 목록 조회는 "내가 공유한 기록"만 보여준다 —
 * 마이페이지 개인 이력이라 Book/BookNote 등과 달리 공개 자원이 아니기 때문.
 */
@RestController
@RequestMapping("/api/share-records")
@RequiredArgsConstructor
@Tag(name = "ShareRecord", description = "공유 기록 API")
public class ShareRecordController {

    private final ShareRecordService shareRecordService;

    @PostMapping
    @Operation(summary = "공유 기록 생성 (shareType=BOOK이면 본인 소유 책만, scope별 targets 규칙은 API 문서 참고)")
    public ResponseEntity<ShareRecordResponse> create(@Valid @RequestBody ShareRecordCreateRequest request,
                                                        @AuthenticationPrincipal Long currentUserId) {
        ShareRecordResponse response = shareRecordService.create(request, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Operation(summary = "내가 공유한 기록 목록 조회")
    public List<ShareRecordResponse> listMine(@AuthenticationPrincipal Long currentUserId) {
        return shareRecordService.listMine(currentUserId);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "공유 기록 삭제 (본인이 공유한 기록만 가능)")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal Long currentUserId) {
        shareRecordService.delete(id, currentUserId);
        return ResponseEntity.noContent().build();
    }
}
