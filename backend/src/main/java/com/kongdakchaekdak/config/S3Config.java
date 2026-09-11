package com.kongdakchaekdak.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.client.config.ClientOverrideConfiguration;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.time.Duration;

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
 *
 * <p><b>(G16 회원 탈퇴, 2026-09-11)</b> 탈퇴 시 사진 오브젝트 삭제용 {@link S3Client}를 추가했다.
 * presigned 발급과 달리 삭제는 실제 네트워크 요청이라 클라이언트가 필요하다. 같은 이유로 {@link Lazy}이고,
 * 탈퇴 응답을 붙잡지 않도록 타임아웃을 짧게 둔다(삭제는 커밋 후 best-effort — BookPhotoObjectCleaner).
 * <b>G2에서 R2 {@code endpointOverride}를 적용할 때 두 빈 모두에 넣어야 한다.</b></p>
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

    @Bean
    @Lazy
    public S3Client s3Client() {
        String accessKey = s3Properties.accessKey() == null ? "" : s3Properties.accessKey();
        String secretKey = s3Properties.secretKey() == null ? "" : s3Properties.secretKey();

        return S3Client.builder()
                .region(Region.of(s3Properties.region()))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)))
                .overrideConfiguration(ClientOverrideConfiguration.builder()
                        .apiCallAttemptTimeout(Duration.ofSeconds(2))
                        .apiCallTimeout(Duration.ofSeconds(5))
                        .build())
                .build();
    }
}
