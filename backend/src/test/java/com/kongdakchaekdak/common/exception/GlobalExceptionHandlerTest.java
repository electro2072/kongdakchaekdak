package com.kongdakchaekdak.common.exception;

import com.kongdakchaekdak.domain.user.User;
import com.kongdakchaekdak.domain.user.UserRepository;
import com.kongdakchaekdak.security.JwtProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * (BUG-20260910-b02) 존재하지 않는 라우트/미지원 HTTP 메서드가 500이 아니라 각각 404/405로
 * 정확히 응답하는지 검증한다.
 *
 * <p>둘 다 인증 토큰을 실어 보낸다 — {@code SecurityConfig}는 {@code PUBLIC_PATHS}에 없는 모든
 * 경로에 {@code anyRequest().authenticated()}를 적용하는데, 이 검사는 실제 핸들러 존재 여부와
 * 무관하게(Ant 패턴 매칭만으로) 가장 먼저 수행된다. 토큰 없이 보내면 DispatcherServlet의 핸들러
 * 매핑 단계까지 가보지도 못하고 401만 확인하게 돼, 정작 검증하려는 404/405 분기(둘 다
 * GlobalExceptionHandler가 처리)에 도달하지 못한다.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class GlobalExceptionHandlerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtProvider jwtProvider;

    private String bearerToken;

    @BeforeEach
    void setUp() {
        User user = new User("테스터", null, null, null, "kakao", "exception-handler-test-social-id");
        Long userId = userRepository.save(user).getId();
        bearerToken = "Bearer " + jwtProvider.generateToken(userId);
    }

    // 존재하지 않는 라우트 — NoHandlerFoundException이 500이 아니라 404 + ROUTE_NOT_FOUND로
    // 응답해야 한다. spring.mvc.throw-exception-if-no-handler-found=true +
    // spring.web.resources.add-mappings=false(둘 다 application.yml, 테스트는 src/test/resources
    // 쪽 별도 사본) 설정이 없으면 이 예외 자체가 발생하지 않고 서블릿 컨테이너가 직접
    // Whitelabel 404를 내려버려(GlobalExceptionHandler를 거치지 않음) 아래 어설션이 실패한다 —
    // 즉 이 테스트가 그 설정이 실제로 걸려 있는지도 함께 검증한다.
    @Test
    void 존재하지_않는_라우트는_404_ROUTE_NOT_FOUND를_반환한다() throws Exception {
        mockMvc.perform(get("/api/does-not-exist-xyz").header("Authorization", bearerToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("ROUTE_NOT_FOUND"));
    }

    // 존재하는 라우트(/api/books — GET/POST만 매핑돼 있음)지만 지원하지 않는 메서드(DELETE)로
    // 온 요청 — HttpRequestMethodNotSupportedException이 500이 아니라 405 +
    // METHOD_NOT_SUPPORTED로 응답해야 한다.
    @Test
    void 지원하지_않는_HTTP_메서드는_405_METHOD_NOT_SUPPORTED를_반환한다() throws Exception {
        mockMvc.perform(delete("/api/books").header("Authorization", bearerToken))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.error").value("METHOD_NOT_SUPPORTED"));
    }
}
