package com.bookflex.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

/**
 * BookPhoto 업로드용 presigned URL 발급 전용 설정.
 *
 * <p><b>(2026-08-28 수정, BUG-20260827-03)</b> 예전 주석은 "accessKey/secretKey가 비어 있어도
 * 애플리케이션 기동 자체는 문제없이 된다"고 적혀 있었는데, 테스터가 실제로 {@code .env} 없이
 * {@code gradle bootRun}을 돌려보니 사실이 아니었다 — AWS SDK의
 * {@code AwsBasicCredentials.create(...)}가 빈 문자열도 "blank"로 취급해 예외를 던져서, 빈 값으로
 * 채워도 기동 시점에 {@code s3Presigner} 빈 생성이 실패하며 컨텍스트 초기화 자체가 깨졌다.
 * {@link Lazy}로 실제 첫 사용 시점(사진 업로드 presigned URL 요청)까지 빈 생성을 미뤄서, 자격증명
 * 없이도 서버 자체는 정상적으로 뜨고 그 기능을 실제로 쓸 때만 오류가 나도록 고쳤다.</p>
 */
@Configuration
@EnableConfigurationProperties(S3Properties.class)
@RequiredArgsConstructor
public class S3Config {

    private final S3Properties s3Properties;

    @Bean
    @Lazy
    public S3Presigner s3Presigner() {
        String accessKey = s3Properties.accessKey() == null ? "" : s3Properties.accessKey();
        String secretKey = s3Properties.secretKey() == null ? "" : s3Properties.secretKey();

        return S3Presigner.builder()
                .region(Region.of(s3Properties.region()))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)))
                .build();
    }
}
