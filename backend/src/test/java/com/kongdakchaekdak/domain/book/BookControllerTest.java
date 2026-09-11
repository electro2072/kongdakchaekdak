package com.kongdakchaekdak.domain.book;

import com.kongdakchaekdak.domain.user.User;
import com.kongdakchaekdak.domain.user.UserRepository;
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

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Step 3부터 /api/books/** 가 인증을 요구하므로, setUp에서 만든 테스트 사용자 id로 발급한
 * 토큰을 모든 요청에 Authorization 헤더로 실어 보낸다. 등록은 본인 명의로만, 수정/완독/삭제는
 * 본인 소유 책에 대해서만 가능하도록 소유자 검증이 적용되어 있다 (BookService 참고).
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class BookControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtProvider jwtProvider;

    private Long userId;
    private String bearerToken;

    @BeforeEach
    void setUp() {
        User user = new User("테스터", null, null, null, "kakao", "test-social-id");
        userId = userRepository.save(user).getId();
        bearerToken = "Bearer " + jwtProvider.generateToken(userId);
    }

    @Test
    void 책_등록_후_기본값이_reading_이다() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "userId", userId,
                "title", "클린 코드",
                "author", "로버트 마틴",
                "startDate", "2026-07-01"
        ));

        mockMvc.perform(post("/api/books")
                        .header("Authorization", bearerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("READING"))
                .andExpect(jsonPath("$.title").value("클린 코드"));
    }

    @Test
    void 등록_조회_수정_완독_전체_흐름이_동작한다() throws Exception {
        String createBody = objectMapper.writeValueAsString(Map.of(
                "userId", userId,
                "title", "이펙티브 자바",
                "author", "조슈아 블로크",
                "startDate", "2026-07-01"
        ));

        String response = mockMvc.perform(post("/api/books")
                        .header("Authorization", bearerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long bookId = objectMapper.readTree(response).get("id").asLong();

        mockMvc.perform(get("/api/books/{id}", bookId).header("Authorization", bearerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.author").value("조슈아 블로크"));

        mockMvc.perform(get("/api/books")
                        .header("Authorization", bearerToken)
                        .param("status", "reading"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(bookId));

        mockMvc.perform(patch("/api/books/{id}/complete", bookId)
                        .header("Authorization", bearerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DONE"))
                .andExpect(jsonPath("$.endDate").exists());
    }

    @Test
    void 존재하지_않는_사용자의_토큰으로_등록하면_401() throws Exception {
        // (G16, 2026-09-11 변경 — 예전 이름 "존재하지_않는_사용자로_등록하면_404") "토큰의 subject 자체가
        // DB에 없는 경우"(로그인 이후 계정이 삭제된 상황)는 이제 JwtAuthenticationFilter가 인증 단계에서
        // 거부한다(탈퇴 후 토큰 무효화). 그래서 BookService.create()의 404 분기(userRepository.findById
        // 실패)에는 더 이상 이 경로로 도달하지 않는다 — 실존 사용자가 남의 userId를 넣으면 403이 먼저다.
        long nonExistentUserId = 999_999L;
        String tokenForMissingUser = "Bearer " + jwtProvider.generateToken(nonExistentUserId);
        String body = objectMapper.writeValueAsString(Map.of(
                "userId", nonExistentUserId,
                "title", "없는 사용자 책",
                "author", "익명",
                "startDate", "2026-07-01"
        ));

        mockMvc.perform(post("/api/books")
                        .header("Authorization", tokenForMissingUser)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("UNAUTHENTICATED"));
    }

    @Test
    void 토큰_없이_요청하면_401() throws Exception {
        mockMvc.perform(get("/api/books/{id}", 1L))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("UNAUTHENTICATED"));
    }

    @Test
    void 다른_사람_명의로_책을_등록하려하면_403() throws Exception {
        User otherUser = new User("다른사람", null, null, null, "kakao", "other-social-id");
        Long otherUserId = userRepository.save(otherUser).getId();

        String body = objectMapper.writeValueAsString(Map.of(
                "userId", otherUserId,
                "title", "남의 이름으로 등록", "author", "익명",
                "startDate", "2026-07-01"
        ));

        mockMvc.perform(post("/api/books")
                        .header("Authorization", bearerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("NOT_OWNER"));
    }

    @Test
    void 다른_사람의_책을_수정_완독_삭제하려하면_403() throws Exception {
        User otherUser = new User("다른사람2", null, null, null, "kakao", "other-social-id-2");
        Long otherUserId = userRepository.save(otherUser).getId();
        String otherToken = "Bearer " + jwtProvider.generateToken(otherUserId);

        String createBody = objectMapper.writeValueAsString(Map.of(
                "userId", otherUserId,
                "title", "남의 책", "author", "익명",
                "startDate", "2026-07-01"
        ));
        String response = mockMvc.perform(post("/api/books")
                        .header("Authorization", otherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Long otherBookId = objectMapper.readTree(response).get("id").asLong();

        String updateBody = objectMapper.writeValueAsString(Map.of(
                "title", "해킹된 제목", "author", "해커",
                "coverImage", "", "isbn", "", "totalPages", 0
        ));
        mockMvc.perform(put("/api/books/{id}", otherBookId)
                        .header("Authorization", bearerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("NOT_OWNER"));

        mockMvc.perform(patch("/api/books/{id}/complete", otherBookId)
                        .header("Authorization", bearerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("NOT_OWNER"));

        mockMvc.perform(delete("/api/books/{id}", otherBookId).header("Authorization", bearerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("NOT_OWNER"));
    }

    // (G20, 2026-09-10) GET /api/books가 클라이언트가 보낸 userId를 그대로 신뢰해, 파라미터를
    // 생략하면 전 회원 서재가 그대로 반환되던 보안 결함(BUG-20260910-25) 회귀 방지 테스트.
    // 이제 목록 조회는 항상 토큰의 currentUserId 기준으로만 필터링된다(userId 쿼리파라미터 자체가 없음).
    @Test
    void 목록_조회는_userId_파라미터_없이도_본인_책만_반환한다() throws Exception {
        User otherUser = new User("다른사람3", null, null, null, "kakao", "other-social-id-3");
        Long otherUserId = userRepository.save(otherUser).getId();
        String otherToken = "Bearer " + jwtProvider.generateToken(otherUserId);

        String otherCreateBody = objectMapper.writeValueAsString(Map.of(
                "userId", otherUserId,
                "title", "다른 사람의 서재", "author", "익명",
                "startDate", "2026-07-01"
        ));
        mockMvc.perform(post("/api/books")
                        .header("Authorization", otherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(otherCreateBody))
                .andExpect(status().isCreated());

        String myCreateBody = objectMapper.writeValueAsString(Map.of(
                "userId", userId,
                "title", "내 서재", "author", "익명",
                "startDate", "2026-07-01"
        ));
        mockMvc.perform(post("/api/books")
                        .header("Authorization", bearerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(myCreateBody))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/books").header("Authorization", bearerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("내 서재"));
    }

    // 2026-08-27: Book.genre가 자유 String에서 Genre enum(6개 고정 카테고리)으로 바뀐 뒤
    // (개발현황.md 30번) 정작 이 계약을 검증하는 테스트가 없었던 것을 테스터가 지적함
    // (테스트코드작성요청_v1.md) — 아래 3개로 등록/수정 시 한글 라벨이 그대로 왕복되는지와
    // 6개 밖의 값이면 400으로 거부되는지를 커버한다.

    @Test
    void 장르를_지정해서_등록하면_한글_라벨_그대로_응답된다() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "userId", userId,
                "title", "코스모스",
                "author", "칼 세이건",
                "startDate", "2026-07-01",
                "genre", "과학"
        ));

        mockMvc.perform(post("/api/books")
                        .header("Authorization", bearerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.genre").value("과학"));
    }

    @Test
    void 등록되지_않은_장르_값이면_400() throws Exception {
        // "판타지"는 디자인이 확정한 6개 카테고리(소설/에세이/자기계발/인문/과학/경제·경영)에 없음.
        String body = objectMapper.writeValueAsString(Map.of(
                "userId", userId,
                "title", "알 수 없는 장르의 책",
                "author", "익명",
                "startDate", "2026-07-01",
                "genre", "판타지"
        ));

        mockMvc.perform(post("/api/books")
                        .header("Authorization", bearerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("MALFORMED_REQUEST"))
                // (2026-09-09) message는 더 이상 응답에 실리지 않는다 — 사용자 문구는 프론트가
                // error 코드로 매핑한다. 예외 상세는 서버 로그까지만 간다.
                .andExpect(jsonPath("$.message").doesNotExist());
    }

    // (OBS-26, 2026-09-10) 완독 처리 시 endDate를 생략하면 서버 JVM 기본 타임존(배포 환경에선
    // UTC)이 아니라 서비스 타임존(KST) 기준 "오늘"이 잡혀야 한다 — 이전에는 UTC 기준으로 계산해
    // KST 00:00~08:59 사이 완독 처리하면 시작일보다 이른 완독일이 잡히는 문제가 있었다(테스터
    // 관측: "2026.09.09 ~ 2026.09.08 (0일)"). CI가 어느 타임존에서 돌든 항상 성립해야 하는
    // 계약이므로, 이 테스트가 도는 JVM의 기본 타임존과 무관하게 Asia/Seoul을 명시해서 비교한다.
    @Test
    void 완독_처리_후_endDate는_startDate보다_이르지_않고_KST_기준_오늘이다() throws Exception {
        String createBody = objectMapper.writeValueAsString(Map.of(
                "userId", userId,
                "title", "완독일_타임존_테스트",
                "author", "익명",
                "startDate", "2026-07-01"
        ));
        String createResponse = mockMvc.perform(post("/api/books")
                        .header("Authorization", bearerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Long bookId = objectMapper.readTree(createResponse).get("id").asLong();

        String completeResponse = mockMvc.perform(patch("/api/books/{id}/complete", bookId)
                        .header("Authorization", bearerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        LocalDate startDate = LocalDate.parse(objectMapper.readTree(completeResponse).get("startDate").asText());
        LocalDate endDate = LocalDate.parse(objectMapper.readTree(completeResponse).get("endDate").asText());

        assertFalse(endDate.isBefore(startDate));
        assertEquals(LocalDate.now(ZoneId.of("Asia/Seoul")), endDate);
    }

    // (OBS-26, 2026-09-10) endDate를 클라이언트가 직접 명시해도 startDate보다 이르면 400으로
    // 막는다 — endDate 생략 시 기본값을 KST로 고정하는 것과 별개로, 잘못된 입력값 자체를
    // 막는 방어선이다.
    @Test
    void 완독일이_시작일보다_빠르면_400() throws Exception {
        String createBody = objectMapper.writeValueAsString(Map.of(
                "userId", userId,
                "title", "잘못된_완독일_테스트",
                "author", "익명",
                "startDate", "2026-07-10"
        ));
        String createResponse = mockMvc.perform(post("/api/books")
                        .header("Authorization", bearerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Long bookId = objectMapper.readTree(createResponse).get("id").asLong();

        String completeBody = objectMapper.writeValueAsString(Map.of("endDate", "2026-07-09"));
        mockMvc.perform(patch("/api/books/{id}/complete", bookId)
                        .header("Authorization", bearerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(completeBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("INVALID_DATE_RANGE"));
    }

    @Test
    void 장르_수정이_반영된다() throws Exception {
        String createBody = objectMapper.writeValueAsString(Map.of(
                "userId", userId,
                "title", "미움받을 용기",
                "author", "기시미 이치로",
                "startDate", "2026-07-01",
                "genre", "자기계발"
        ));
        String response = mockMvc.perform(post("/api/books")
                        .header("Authorization", bearerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Long bookId = objectMapper.readTree(response).get("id").asLong();

        String updateBody = objectMapper.writeValueAsString(Map.of("genre", "에세이"));
        mockMvc.perform(put("/api/books/{id}", bookId)
                        .header("Authorization", bearerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.genre").value("에세이"))
                .andExpect(jsonPath("$.title").value("미움받을 용기"));
    }
}
