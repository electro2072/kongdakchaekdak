package com.bookflex.domain.auth.oauth2;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Configuration
@EnableConfigurationProperties({KakaoOAuthProperties.class, GoogleOAuthProperties.class, NaverOAuthProperties.class})
public class OAuth2Config {

    private static final Duration TIMEOUT = Duration.ofSeconds(5);

    // 카카오/구글/네이버 사용자 정보 API 호출 전용. spring-boot-starter-web에 이미 포함된
    // RestTemplateBuilder만 사용해서 별도 HTTP 클라이언트 의존성을 추가하지 않는다.
    // 타임아웃을 반드시 지정해서, 세 제공자 중 하나가 응답이 느려지거나 멈춰도 요청 스레드가
    // 무한정 붙잡혀 있지 않게 한다.
    @Bean
    public RestTemplate oauth2RestTemplate(RestTemplateBuilder builder) {
        return builder
                .connectTimeout(TIMEOUT)
                .readTimeout(TIMEOUT)
                .build();
    }
}
