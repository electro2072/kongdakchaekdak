package com.kongdakchaekdak.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * app.s3.* 값을 바인딩한다. 실제 값(accessKey/secretKey/bucket)은 절대 여기에 직접 쓰지 않고
 * backend/.env 파일(git에 커밋되지 않음)에 KEY=VALUE로 넣는다 — build.gradle.kts의 bootRun
 * 설정이 .env를 읽어 환경변수로 넘겨준다 (.env.example 참고).
 *
 * <p>presignedUrlExpirationSeconds: 발급한 presigned URL(사진 업로드용)이 유효한 시간. 너무 길면
 * URL이 유출됐을 때 위험이 커지고, 너무 짧으면 모바일 앱에서 업로드 시작 전에 만료될 수 있어
 * 기본값 600초(10분)로 둔다.</p>
 */
@ConfigurationProperties(prefix = "app.s3")
public record S3Properties(
        String bucket,
        String region,
        String accessKey,
        String secretKey,
        Long presignedUrlExpirationSeconds
) {
}
