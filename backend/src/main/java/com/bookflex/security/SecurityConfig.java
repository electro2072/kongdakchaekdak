package com.bookflex.security;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Step 3(인증) 판단 사항: 이메일/PW 인증 구조 검증이 끝나서, 이제 User/Book API를
 * 실제로 "인증된 사용자만" 호출 가능하도록 잠근다. 회원가입/로그인 자체와 헬스체크/Swagger
 * 문서 경로만 예외로 열어둔다.
 * 리소스별 소유자 검증(내 책만 수정 가능 등 — 지금은 "로그인만 했으면 다른 사람 책도 수정 가능")은
 * 아직 없고 이후 단계에서 강화 예정.
 *
 * h2-console(local 프로필 전용)이 프레임을 사용하므로 frameOptions는 완전 비활성화 대신
 * sameOrigin으로 완화한다 (같은 출처 프레임만 허용, 클릭재킹 방어는 유지).
 */
@Configuration
@EnableWebSecurity
@EnableConfigurationProperties(JwtProperties.class)
@RequiredArgsConstructor
public class SecurityConfig {

    private static final String[] PUBLIC_PATHS = {
            "/health",
            "/api/auth/signup",
            "/api/auth/login",
            "/api/auth/kakao",
            "/api/auth/google",
            "/api/auth/naver",
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/v3/api-docs/**",
            "/h2-console/**"
    };

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(PUBLIC_PATHS).permitAll()
                        .anyRequest().authenticated()
                )
                .exceptionHandling(handling -> handling.authenticationEntryPoint(jwtAuthenticationEntryPoint))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
