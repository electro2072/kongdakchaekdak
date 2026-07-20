package com.bookflex.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

/**
 * BookPhoto 업로드용 presigned URL 발급 전용 설정. S3Presigner는 실제로 S3에 네트워크 요청을
 * 보내지 않고 로컬에서 서명만 계산하기 때문에(SdkHttpClient 불필요), accessKey/secretKey가
 * 아직 비어 있어도(.env 작성 전) 애플리케이션 기동 자체는 문제없이 된다 — 실제로 사진 업로드
 * presigned URL을 요청하는 시점에야 자격증명이 필요해진다.
 */
@Configuration
@EnableConfigurationProperties(S3Properties.class)
@RequiredArgsConstructor
public class S3Config {

    private final S3Properties s3Properties;

    @Bean
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
