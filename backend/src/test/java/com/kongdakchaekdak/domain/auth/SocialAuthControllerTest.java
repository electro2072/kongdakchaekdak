package com.kongdakchaekdak.domain.auth;

import com.kongdakchaekdak.common.exception.ErrorCode;
import com.kongdakchaekdak.common.exception.InvalidCredentialsException;
import com.kongdakchaekdak.domain.auth.oauth2.AppleOAuthClient;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
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
 *
 * <p>2026-09-09: 애플 로그인 성공 케이스를 추가했다 — {@link AppleOAuthClient}도 다른 3개
 * 제공자와 동일하게 {@code @MockBean}으로 대체해서 "identity token 검증까지 끝나고 이런
 * SocialUserInfo를 돌려줬다"는 상황만 가정한다(실제 애플 JWKS 서명 검증 로직 자체는
 * AppleOAuthClientTest에서 별도로 검증). 애플은 nicknameHint를 항상 null로 반환하므로
 * (설계 문서 5번 참고), 이 테스트에서도 그 계약을 그대로 반영한다.</p>
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

    @MockBean
    private AppleOAuthClient appleOAuthClient;

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
                .thenThrow(new InvalidCredentialsException(ErrorCode.SOCIAL_AUTH_FAILED, "카카오 인증에 실패했습니다. 액세스 토큰을 확인해주세요."));

        String body = objectMapper.writeValueAsString(Map.of("accessToken", "invalid-token"));

        mockMvc.perform(post("/api/auth/kakao").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("SOCIAL_AUTH_FAILED"));
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
    void 애플_로그인_성공시_신규_회원가입_후_토큰이_발급되고_isNewUser가_true다() throws Exception {
        // 애플은 identity token에 이름이 없어 AppleOAuthClient가 nicknameHint로 항상 null을
        // 돌려준다(설계 문서 5번 참고) — 여기서도 그 계약대로 null을 넘겨서, 신규 가입 시
        // RandomNicknameGenerator가 임시 닉네임을 채워주는 기존 경로를 그대로 타는지 확인한다.
        when(appleOAuthClient.fetchUserInfo("apple-identity-token"))
                .thenReturn(new SocialUserInfo("apple-sub-99999", null));

        String body = objectMapper.writeValueAsString(Map.of("idToken", "apple-identity-token"));

        mockMvc.perform(post("/api/auth/apple").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.isNewUser").value(true));
    }

    @Test
    void 애플_identity_token이_유효하지_않으면_401() throws Exception {
        when(appleOAuthClient.fetchUserInfo(anyString()))
                .thenThrow(new InvalidCredentialsException(ErrorCode.SOCIAL_AUTH_FAILED, "애플 인증에 실패했습니다. identity token을 확인해주세요."));

        String body = objectMapper.writeValueAsString(Map.of("idToken", "invalid-token"));

        mockMvc.perform(post("/api/auth/apple").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("SOCIAL_AUTH_FAILED"));
    }

    @Test
    void 토큰_없이_카카오_로그인_요청하면_400() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of());

        mockMvc.perform(post("/api/auth/kakao").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("VALIDATION_FAILED"));
    }

    @Test
    void 로그인_성공시_me_응답에_lastLoginAt과_daysSinceLastLogin이_포함된다() throws Exception {
        // 비활성 사용자 인앱 알림 설계(claude/독서기록앱_백엔드_비활성사용자_알림_설계_v1.md)
        // 5번 엣지케이스 — 가입 자체가 첫 로그인이므로 daysSinceLastLogin은 항상 0이어야 한다.
        // "정확히 며칠 지났는지" 계산 로직 자체(30일 등 경계값)는 UserResponseTest에서
        // 시각을 직접 조작해 별도로 검증한다 — 여기서는 로그인→/me API 계약만 확인한다.
        when(kakaoOAuthClient.fetchUserInfo("kakao-access-token"))
                .thenReturn(new SocialUserInfo("88888", "최근접속유저"));

        String body = objectMapper.writeValueAsString(Map.of("accessToken", "kakao-access-token"));

        String loginResponse = mockMvc.perform(post("/api/auth/kakao")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String token = objectMapper.readTree(loginResponse).get("accessToken").asText();

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lastLoginAt").exists())
                .andExpect(jsonPath("$.daysSinceLastLogin").value(0));
    }

    // (G16 회원 탈퇴, 2026-09-11) 수용 기준 2 — 탈퇴 후 같은 소셜 계정으로 다시 로그인하면 기존 계정에
    // 매칭되지 않고 신규 가입 플로우(isNewUser=true)로 들어가야 한다. 사용자 행이 실제로 삭제돼야만
    // 통과한다(소프트 삭제·익명화였다면 (social_provider, social_id)로 다시 매칭된다).
    @Test
    void 탈퇴_후_같은_카카오_계정으로_로그인하면_신규가입으로_처리되고_새_id가_발급된다() throws Exception {
        when(kakaoOAuthClient.fetchUserInfo("kakao-withdraw-access-token"))
                .thenReturn(new SocialUserInfo("44444-withdraw", "탈퇴후재가입"));
        String body = objectMapper.writeValueAsString(Map.of("accessToken", "kakao-withdraw-access-token"));

        String firstResponse = mockMvc.perform(post("/api/auth/kakao")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isNewUser").value(true))
                .andReturn().getResponse().getContentAsString();
        String firstToken = objectMapper.readTree(firstResponse).get("accessToken").asText();
        Long firstUserId = extractUserId(firstResponse);

        mockMvc.perform(delete("/api/users/{id}", firstUserId).header("Authorization", "Bearer " + firstToken))
                .andExpect(status().isNoContent());

        String secondResponse = mockMvc.perform(post("/api/auth/kakao")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isNewUser").value(true))
                .andReturn().getResponse().getContentAsString();
        Long secondUserId = extractUserId(secondResponse);

        org.junit.jupiter.api.Assertions.assertNotEquals(firstUserId, secondUserId);
        // 탈퇴 전 토큰이 새 계정으로 이어지지 않는다.
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + firstToken))
                .andExpect(status().isUnauthorized());
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
