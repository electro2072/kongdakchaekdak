package com.bookflex.domain.bookphoto;

import com.bookflex.domain.bookphoto.dto.BookPhotoCreateRequest;
import com.bookflex.domain.bookphoto.dto.BookPhotoResponse;
import com.bookflex.domain.bookphoto.dto.PresignedUrlRequest;
import com.bookflex.domain.bookphoto.dto.PresignedUrlResponse;
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
 * 책 상세 페이지의 장소 사진(BookPhoto) API (Step 4). S3 업로드는 2단계 흐름을 따른다:
 * (1) POST .../photos/presigned-url 로 업로드 URL을 발급받아 클라이언트가 S3에 직접 PUT,
 * (2) 업로드 성공 후 POST .../photos 로 실제 레코드를 생성. 등록/삭제는 본인 소유 책에 대해서만
 * 가능하고, 조회는 Book/User와 동일한 원칙으로 다른 회원의 사진도 볼 수 있게 열어둔다.
 */
@RestController
@RequestMapping("/api/books/{bookId}/photos")
@RequiredArgsConstructor
@Tag(name = "BookPhoto", description = "책 상세 페이지 장소 사진 API")
public class BookPhotoController {

    private final BookPhotoService bookPhotoService;

    @PostMapping("/presigned-url")
    @Operation(summary = "사진 업로드용 presigned URL 발급 (본인 소유 책만 가능)")
    public PresignedUrlResponse issuePresignedUrl(@PathVariable Long bookId,
                                                    @Valid @RequestBody PresignedUrlRequest request,
                                                    @AuthenticationPrincipal Long currentUserId) {
        return bookPhotoService.issuePresignedUploadUrl(bookId, request, currentUserId);
    }

    @PostMapping
    @Operation(summary = "사진 등록 (S3 업로드 완료 후 호출, 본인 소유 책만 가능)")
    public ResponseEntity<BookPhotoResponse> create(@PathVariable Long bookId,
                                                      @Valid @RequestBody BookPhotoCreateRequest request,
                                                      @AuthenticationPrincipal Long currentUserId) {
        BookPhotoResponse response = bookPhotoService.create(bookId, request, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Operation(summary = "책 기록의 사진 목록 조회")
    public List<BookPhotoResponse> list(@PathVariable Long bookId) {
        return bookPhotoService.list(bookId);
    }

    @DeleteMapping("/{photoId}")
    @Operation(summary = "사진 삭제 (본인 소유 책만 가능)")
    public ResponseEntity<Void> delete(@PathVariable Long bookId, @PathVariable Long photoId,
                                        @AuthenticationPrincipal Long currentUserId) {
        bookPhotoService.delete(bookId, photoId, currentUserId);
        return ResponseEntity.noContent().build();
    }
}
