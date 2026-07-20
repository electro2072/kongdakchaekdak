package com.bookflex.domain.user;

import com.bookflex.security.JwtProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.matchesPattern;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Step 3부터 /api/users/** 가 인증을 요구하므로, 모든 요청에 임의의 인증된 사용자(id=1) 토큰을
 * Authorization 헤더로 실어 보낸다. 조회(단건/목록)는 소유자 검증이 없어 이 id가 실제로 존재하는
 * 회원일 필요는 없지만, 수정/삭제는 본인 계정에 대해서만 가능하도록 소유자 검증이 적용되어 있어
 * (UserService 참고) 대상 id와 토큰의 주체가 같아야 하는 테스트에서는 별도로 그 id로 토큰을 발급한다.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtProvider jwtProvider;

    private String bearerToken() {
        return "Bearer " + jwtProvider.generateToken(1L);
    }

    private String bearerToken(Long userId) {
        return "Bearer " + jwtProvider.generateToken(userId);
    }

    @Test
    void 닉네임_없이_생성하면_랜덤_닉네임이_부여된다() throws Exception {
        String body = objectMapper.writeValueAsString(new java.util.HashMap<>());

        mockMvc.perform(post("/api/users")
                        .header("Authorization", bearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nickname").value(matchesPattern("^(책벌레|독서가|이야기꾼|페이지터너)\\d{4}$")))
                .andExpect(jsonPath("$.gender").value("NONE"));
    }

    @Test
    void 회원_생성_후_단건_조회_수정_삭제가_동작한다() throws Exception {
        String createBody = """
                {"nickname": "테스터", "bio": "안녕하세요"}
                """;

        String response = mockMvc.perform(post("/api/users")
                        .header("Authorization", bearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nickname").value("테스터"))
                .andReturn().getResponse().getContentAsString();

        Long id = objectMapper.readTree(response).get("id").asLong();
        String ownerToken = bearerToken(id);

        mockMvc.perform(get("/api/users/{id}", id).header("Authorization", bearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bio").value("안녕하세요"));

        String updateBody = """
                {"bio": "수정된 소개"}
                """;
        mockMvc.perform(patch("/api/users/{id}", id)
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bio").value("수정된 소개"))
                .andExpect(jsonPath("$.nickname").value("테스터"));

        mockMvc.perform(delete("/api/users/{id}", id).header("Authorization", ownerToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/users/{id}", id).header("Authorization", bearerToken()))
                .andExpect(status().isNotFound());
    }

    @Test
    void 다른_회원의_정보를_수정하려하면_403() throws Exception {
        String createBody = """
                {"nickname": "피해자"}
                """;
        String response = mockMvc.perform(post("/api/users")
                        .header("Authorization", bearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Long victimId = objectMapper.readTree(response).get("id").asLong();

        // victimId가 아닌 다른 사용자(그 id + 1)의 토큰으로 수정 시도
        String attackerToken = bearerToken(victimId + 1);
        String updateBody = """
                {"bio": "해킹된 소개"}
                """;
        mockMvc.perform(patch("/api/users/{id}", victimId)
                        .header("Authorization", attackerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("FORBIDDEN"));
    }

    @Test
    void 다른_회원의_정보를_삭제하려하면_403() throws Exception {
        String createBody = """
                {"nickname": "피해자2"}
                """;
        String response = mockMvc.perform(post("/api/users")
                        .header("Authorization", bearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Long victimId = objectMapper.readTree(response).get("id").asLong();

        String attackerToken = bearerToken(victimId + 1);
        mockMvc.perform(delete("/api/users/{id}", victimId).header("Authorization", attackerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("FORBIDDEN"));
    }

    @Test
    void 존재하지_않는_회원_조회시_404() throws Exception {
        mockMvc.perform(get("/api/users/{id}", 999_999L).header("Authorization", bearerToken()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("NOT_FOUND"));
    }

    @Test
    void 소개글이_너무_길면_400과_필드에러를_반환한다() throws Exception {
        String tooLongBio = "가".repeat(101);
        String body = objectMapper.writeValueAsString(java.util.Map.of("bio", tooLongBio));

        mockMvc.perform(post("/api/users")
                        .header("Authorization", bearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors[0].field").value("bio"));
    }

    @Test
    void 토큰_없이_요청하면_401() throws Exception {
        mockMvc.perform(get("/api/users/{id}", 1L))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("UNAUTHENTICATED"));
    }
}
