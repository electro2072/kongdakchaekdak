package com.kongdakchaekdak.domain.user;

import com.kongdakchaekdak.security.JwtProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.matchesPattern;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Step 3부터 /api/users/** 가 인증을 요구하므로, 모든 요청에 인증된 사용자 토큰을 Authorization 헤더로
 * 실어 보낸다. 조회(단건)·수정·삭제는 전부 본인 계정에 대해서만 가능하도록 소유자 검증이 적용되어
 * 있어(UserService 참고, G20 확장으로 조회도 포함됨, 2026-09-10) 대상 id와 토큰의 주체가 같아야 하는
 * 테스트에서는 별도로 그 id로 토큰을 발급한다.
 *
 * <p><b>(G16, 2026-09-11)</b> 예전엔 DB에 없는 id(1, victimId + 1)로 토큰을 만들어 썼다. 이제
 * JwtAuthenticationFilter가 토큰 주체의 존재를 확인하므로(탈퇴 후 토큰 무효화) 그런 토큰은 401이다.
 * 호출자·공격자 역할은 {@link #setUp()}에서 실제로 저장한 사용자로 바꿨다.</p>
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

    @Autowired
    private UserRepository userRepository;

    private Long callerId;

    @BeforeEach
    void setUp() {
        callerId = userRepository.save(new User("호출자", null, null, null, "kakao", "user-controller-test-caller")).getId();
    }

    /** 실제로 존재하는 호출자(대상 계정과는 다른 사람) 토큰. */
    private String bearerToken() {
        return "Bearer " + jwtProvider.generateToken(callerId);
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

        mockMvc.perform(get("/api/users/{id}", id).header("Authorization", ownerToken))
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

        // (G16) 탈퇴 후 기존 토큰은 인증 단계에서 거부된다 — 예전엔 소유자 검증을 통과해 404였다.
        mockMvc.perform(get("/api/users/{id}", id).header("Authorization", ownerToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("UNAUTHENTICATED"));
    }

    // (G20 확장, 2026-09-10) 회귀 방지 테스트 — 인증만 되어 있으면 누구든 타인 id로 조회할 수
    // 있던 결함(BUG-20260910-25와 같은 패턴)이 다시 생기지 않는지 확인한다.
    @Test
    void 다른_회원의_정보를_조회하려하면_403() throws Exception {
        String createBody = """
                {"nickname": "피해자3"}
                """;
        String response = mockMvc.perform(post("/api/users")
                        .header("Authorization", bearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Long victimId = objectMapper.readTree(response).get("id").asLong();

        String attackerToken = bearerToken();
        mockMvc.perform(get("/api/users/{id}", victimId).header("Authorization", attackerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("NOT_OWNER"));
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

        // victimId가 아닌 다른 실존 사용자(호출자)의 토큰으로 수정 시도
        String attackerToken = bearerToken();
        String updateBody = """
                {"bio": "해킹된 소개"}
                """;
        mockMvc.perform(patch("/api/users/{id}", victimId)
                        .header("Authorization", attackerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("NOT_OWNER"));
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

        String attackerToken = bearerToken();
        mockMvc.perform(delete("/api/users/{id}", victimId).header("Authorization", attackerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("NOT_OWNER"));
    }

    @Test
    void 존재하지_않는_회원의_토큰이면_401() throws Exception {
        // (G16, 2026-09-11) 예전 이름은 "존재하지_않는_회원_조회시_404". 서명이 유효해도 주체가 DB에 없으면
        // JwtAuthenticationFilter가 인증하지 않으므로, 컨트롤러의 404 분기에 도달하기 전에 401이 된다.
        long missingId = 999_999L;
        mockMvc.perform(get("/api/users/{id}", missingId).header("Authorization", bearerToken(missingId)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("UNAUTHENTICATED"));
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

    // 2026-08-27: User.interests(관심분야, Set<Genre>)가 회원가입/프로필수정 DTO에 실제로
    // 연동됐지만(개발현황.md 30번) 이 계약을 검증하는 테스트가 없었던 것을 테스터가 지적함
    // (테스트코드작성요청_v1.md) — 아래 4개로 등록 시 반영/6개 밖 값 거부/빈 배열=전체 해제/
    // 필드 생략=변경 없음(User.updateInterests 시맨틱) 네 가지를 각각 커버한다.

    @Test
    void 관심분야를_지정해서_가입하면_응답에_반영된다() throws Exception {
        String body = objectMapper.writeValueAsString(java.util.Map.of(
                "nickname", "장르덕후",
                "interests", java.util.List.of("소설", "과학")
        ));

        mockMvc.perform(post("/api/users")
                        .header("Authorization", bearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.interests.length()").value(2))
                .andExpect(jsonPath("$.interests", containsInAnyOrder("소설", "과학")));
    }

    @Test
    void 등록되지_않은_관심분야_값이면_400() throws Exception {
        // "판타지"는 디자인이 확정한 6개 카테고리(소설/에세이/자기계발/인문/과학/경제·경영)에 없음.
        String body = objectMapper.writeValueAsString(java.util.Map.of(
                "nickname", "잘못된입력",
                "interests", java.util.List.of("판타지")
        ));

        mockMvc.perform(post("/api/users")
                        .header("Authorization", bearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("MALFORMED_REQUEST"));
    }

    @Test
    void 관심분야를_빈_배열로_수정하면_전체_해제된다() throws Exception {
        String createBody = objectMapper.writeValueAsString(java.util.Map.of(
                "nickname", "해제될사람",
                "interests", java.util.List.of("인문", "경제·경영")
        ));
        String response = mockMvc.perform(post("/api/users")
                        .header("Authorization", bearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.interests.length()").value(2))
                .andReturn().getResponse().getContentAsString();
        Long id = objectMapper.readTree(response).get("id").asLong();

        String updateBody = objectMapper.writeValueAsString(java.util.Map.of("interests", java.util.List.of()));
        mockMvc.perform(patch("/api/users/{id}", id)
                        .header("Authorization", bearerToken(id))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.interests").isEmpty());
    }

    @Test
    void 관심분야_필드를_생략하고_수정하면_기존_값이_유지된다() throws Exception {
        // User.updateInterests(Set)의 null=변경없음 시맨틱 — interests 키 자체를 요청 바디에서
        // 생략하면(다른 필드만 수정) 기존 관심분야가 그대로 남아야 한다.
        String createBody = objectMapper.writeValueAsString(java.util.Map.of(
                "nickname", "유지될사람",
                "interests", java.util.List.of("에세이")
        ));
        String response = mockMvc.perform(post("/api/users")
                        .header("Authorization", bearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Long id = objectMapper.readTree(response).get("id").asLong();

        String updateBody = objectMapper.writeValueAsString(java.util.Map.of("bio", "관심분야는 안 건드림"));
        mockMvc.perform(patch("/api/users/{id}", id)
                        .header("Authorization", bearerToken(id))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bio").value("관심분야는 안 건드림"))
                .andExpect(jsonPath("$.interests", containsInAnyOrder("에세이")));
    }
}
