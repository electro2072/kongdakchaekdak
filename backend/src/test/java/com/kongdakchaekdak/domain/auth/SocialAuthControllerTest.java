package com.kongdakchaekdak.domain.auth;

import com.kongdakchaekdak.common.exception.InvalidCredentialsException;
import com.kongdakchaekdak.domain.auth.oauth2.GoogleOAuthClient;
import com.kongdakchaekdak.domain.auth.oauth2.KakaoOAuthClient;
import com.kongdakchaekdak.domain.auth.oauth2.NaverOAuthClient;
import com.kongdakchaekdak.domain.auth.oauth2.SocialUserInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 카카오/구글/네이버 실제 서버를 호출할 수 없으므로(그리고 그래서도 안 되므로), 각 OAuthClient를
 * @MockBean으로 대체해서 "제공자가 이런 사용자 정보를 돌려줬다"는 상황만 가정하고 그 뒤
 * (신규가입/기존회원 매칭/토큰발급) 로직만 검증한다. 실제 카카오/구글/네이버 연동 자체는
 * .env에 키를 넣고 로컬에서 모바일 앱과 함께 수동으로 확인해야 한다.
 *
 * <p>{@code 토큰_없이_me_조회하면_401}은 원래 AuthControllerTest(이메일/PW 로그인 테스트)에
 * 있었으나, 이메일/PW 로그인이 완전히 삭제되면서(2026-08-27) 이 클래스로 옮겨 커버리지를
 * 유지했다 — {@code /api/auth/me}는 소셜 로그인 사용자도 그대로 쓰는 공통 엔드포인트다.</p>
 *
 * <p>2026-08-29: {@code TokenResponse.isNewUser} 계약(신규 가입이면 true, 기존 회원 재로그인이면
 * false) 검증을 추가했다 — 프론트요청 문서(신규회원판별_v1) 반영.</p>
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class SocialAuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private KakaoOAuthClient kakaoOAuthClient;

    @MockBean
    private GoogleOAuthClient googleOAuthClient;

    @MockBean
    private NaverOAuthClient naverOAuthClient;

    @Test
    void 카카오_로그인_성공시_신규_회원가입_후_토큰이_발급된다() throws Exception {
        when(kakaoOAuthClient.fetchUserInfo("kakao-access-token"))
                .thenReturn(new SocialUserInfo("11111", "카카오유저"));

        String body = objectMapper.writeValueAsString(Map.of("accessToken", "kakao-access-token"));

        String response = mockMvc.perform(post("/api/auth/kakao")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.isNewUser").value(true))
                .andReturn().getResponse().getContentAsString();

        String token = objectMapper.readTree(response).get("accessToken").asText();

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nickname").value("카카오유저"));
    }

    @Test
    void 같은_카카오_id로_다시_로그인하면_같은_회원으로_인식하고_isNewUser가_false다() throws Exception {
        when(kakaoOAuthClient.fetchUserInfo("kakao-access-token"))
                .thenReturn(new SocialUserInfo("22222", "재로그인유저"));

        String body = objectMapper.writeValueAsString(Map.of("accessToken", "kakao-access-token"));

        String firstResponse = mockMvc.perform(post("/api/auth/kakao")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isNewUser").value(true))
                .andReturn().getResponse().getContentAsString();
        Long firstUserId = extractUserId(firstResponse);

        String secondResponse = mockMvc.perform(post("/api/auth/kakao")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isNewUser").value(false))
                .andReturn().getResponse().getContentAsString();
        Long secondUserId = extractUserId(secondResponse);

        org.junit.jupiter.api.Assertions.assertEquals(firstUserId, secondUserId);
    }

    @Test
    void 카카오_토큰이_유효하지_않으면_401() throws Exception {
        when(kakaoOAuthClient.fetchUserInfo(anyString()))
                .thenThrow(new InvalidCredentialsException("카카오 인증에 실패했습니다. 액세스 토큰을 확인해주세요."));

        String body = objectMapper.writeValueAsString(Map.of("accessToken", "invalid-token"));

        mockMvc.perform(post("/api/auth/kakao").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("INVALID_CREDENTIALS"));
    }

    @Test
    void 구글_로그인_성공시_토큰이_발급된다() throws Exception {
        when(googleOAuthClient.fetchUserInfo("google-id-token"))
                .thenReturn(new SocialUserInfo("google-sub-123", "구글유저"));

        String body = objectMapper.writeValueAsString(Map.of("idToken", "google-id-token"));

        mockMvc.perform(post("/api/auth/google").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.isNewUser").value(true));
    }

    @Test
    void 네이버_로그인_성공시_토큰이_발급된다() throws Exception {
        when(naverOAuthClient.fetchUserInfo("naver-access-token"))
                .thenReturn(new SocialUserInfo("naver-33333", "네이버유저"));

        String body = objectMapper.writeValueAsString(Map.of("accessToken", "naver-access-token"));

        mockMvc.perform(post("/api/auth/naver").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.isNewUser").value(true));
    }

    @Test
    void 토큰_없이_카카오_로그인_요청하면_400() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of());

        mockMvc.perform(post("/api/auth/kakao").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("VALIDATION_FAILED"));
    }

    @Test
    void 토큰_없이_me_조회하면_401() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("UNAUTHENTICATED"));
    }

    private Long extractUserId(String tokenResponseJson) throws Exception {
        String token = objectMapper.readTree(tokenResponseJson).get("accessToken").asText();
        String meResponse = mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(meResponse).get("id").asLong();
    }
}
