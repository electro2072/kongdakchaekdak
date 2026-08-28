package com.kongdakchaekdak.domain.bookphoto.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * S3 업로드용 presigned URL 발급 요청. fileName은 원본 파일명이 그대로 S3 key에 쓰이지 않고
 * 확장자만 추출해서 쓰인다 (BookPhotoService 참고, 경로 조작 방지 목적).
 */
public record PresignedUrlRequest(
        @NotBlank String fileName,
        @NotBlank
        @Pattern(regexp = "^image/.+$", message = "이미지 파일만 업로드할 수 있습니다.")
        String contentType
) {
}
