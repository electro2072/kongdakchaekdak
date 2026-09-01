package com.kongdakchaekdak.common.exception;

/**
 * (2026-08-31, BUG-20260827-03 "조각2") 이미지 업로드(presigned URL 발급) 자체가 실패한 경우
 * 던지는 예외 — 대표적으로 {@code app.s3.access-key}/{@code secret-key}가 비어 있거나 잘못된 경우.
 *
 * <p>BUG-03 조각1(2026-08-29, {@code S3Presigner} 주입 지점 {@code @Lazy})로 서버 기동 자체는 더 이상
 * 실패하지 않는다. 하지만 그 이후 실제로 {@code POST /api/books/{bookId}/photos/presigned-url}을
 * 호출하면, 그 시점에야 지연됐던 {@code S3Presigner} 빈이 처음 생성되면서 AWS SDK의
 * {@code AwsBasicCredentials.create(...)}가 빈 자격증명을 거부해 {@link IllegalArgumentException}을
 * 던진다 — 이 예외가 그동안 잡히는 곳 없이 그대로 올라가 {@code GlobalExceptionHandler}의 catch-all
 * (500 INTERNAL_SERVER_ERROR)로 흘러갔다. 클라이언트 입장에서는 "이미지 업로드 기능이 아직 설정되지
 * 않았다"는 걸 알 방법이 없는 의미 없는 500이었다.</p>
 *
 * <p>{@code BookPhotoService.issuePresignedUploadUrl}이 자격증명 관련 예외
 * ({@link IllegalArgumentException}, {@code software.amazon.awssdk.core.exception.SdkException})를
 * 잡아 이 예외로 감싸고, {@code GlobalExceptionHandler}가 503(SERVICE_UNAVAILABLE)으로 명확하게
 * 변환한다 — "서버 오류"가 아니라 "이 기능이 아직 설정 안 됨"이라는 의미를 정확히 전달하기 위해
 * 500이 아니라 503을 쓴다.</p>
 */
public class ImageStorageUnavailableException extends RuntimeException {
    public ImageStorageUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
