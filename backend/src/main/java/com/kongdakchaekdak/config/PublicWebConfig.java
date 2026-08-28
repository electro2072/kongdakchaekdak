package com.kongdakchaekdak.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * PublicWebProperties(app.public-web.*) 바인딩 활성화 전용 설정 클래스.
 * S3Config가 S3Properties를 활성화하는 것과 동일한 패턴.
 */
@Configuration
@EnableConfigurationProperties(PublicWebProperties.class)
public class PublicWebConfig {
}
