package com.bookflex.domain.book;

import com.bookflex.domain.user.User;
import com.bookflex.domain.user.UserRepository;
import com.bookflex.security.JwtProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

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
                        .param("userId", String.valueOf(userId))
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
    void 존재하지_않는_사용자로_등록하면_404() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "userId", 999_999L,
                "title", "없는 사용자 책",
                "author", "익명",
                "startDate", "2026-07-01"
        ));

        mockMvc.perform(post("/api/books")
                        .header("Authorization", bearerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isNotFound());
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
                .andExpect(jsonPath("$.error").value("FORBIDDEN"));
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
                "coverImage", "", "isbn", "", "genre", "", "totalPages", 0
        ));
        mockMvc.perform(put("/api/books/{id}", otherBookId)
                        .header("Authorization", bearerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("FORBIDDEN"));

        mockMvc.perform(patch("/api/books/{id}/complete", otherBookId)
                        .header("Authorization", bearerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("FORBIDDEN"));

        mockMvc.perform(delete("/api/books/{id}", otherBookId).header("Authorization", bearerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("FORBIDDEN"));
    }
}
