package com.bookflex.domain.book;

import com.bookflex.domain.user.User;
import com.bookflex.domain.user.UserRepository;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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

    private Long userId;

    @BeforeEach
    void setUp() {
        User user = new User("테스터", null, null, null, "kakao", "test-social-id");
        userId = userRepository.save(user).getId();
    }

    @Test
    void 책_등록_후_기본값이_reading_이다() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "userId", userId,
                "title", "클린 코드",
                "author", "로버트 마틴",
                "startDate", "2026-07-01"
        ));

        mockMvc.perform(post("/api/books").contentType(MediaType.APPLICATION_JSON).content(body))
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
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long bookId = objectMapper.readTree(response).get("id").asLong();

        mockMvc.perform(get("/api/books/{id}", bookId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.author").value("조슈아 블로크"));

        mockMvc.perform(get("/api/books").param("userId", String.valueOf(userId)).param("status", "reading"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(bookId));

        mockMvc.perform(patch("/api/books/{id}/complete", bookId)
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

        mockMvc.perform(post("/api/books").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isNotFound());
    }
}
