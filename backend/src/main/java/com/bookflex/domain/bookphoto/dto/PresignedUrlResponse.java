package com.bookflex.domain.bookphoto.dto;

/**
 * @param uploadUrl 클라이언트가 이 URL로 직접 S3에 PUT 요청을 보내 파일을 업로드한다
 *                  (Content-Type 헤더를 요청 시 지정한 contentType과 동일하게 보내야 서명이 유효함).
 * @param imageUrl  업로드 완료 후 실제로 접근 가능한 공개 URL — 이후 POST /api/books/{id}/photos
 *                  호출 시 이 값을 그대로 imageUrl로 넘기면 됨.
 * @param key       S3 오브젝트 키 (디버깅/로깅용).
 * @param expiresInSeconds uploadUrl의 유효 시간(초). 이 시간이 지나면 업로드 재시도 시 새 URL을 다시 발급받아야 함.
 */
public record PresignedUrlResponse(
        String uploadUrl,
        String imageUrl,
        String key,
        long expiresInSeconds
) {
}
