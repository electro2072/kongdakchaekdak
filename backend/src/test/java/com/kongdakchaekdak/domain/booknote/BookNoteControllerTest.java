package com.kongdakchaekdak.domain.booknote;

import com.kongdakchaekdak.domain.book.Book;
import com.kongdakchaekdak.domain.book.BookRepository;
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
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class BookNoteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private JwtProvider jwtProvider;

    private Long bookId;
    private String bearerToken;

    @BeforeEach
    void setUp() {
        User user = new User("테스터", null, null, null, "kakao", "note-test-social-id");
        Long userId = userRepository.save(user).getId();
        bearerToken = "Bearer " + jwtProvider.generateToken(userId);

        Book book = new Book(user, "클린 코드", "로버트 마틴", null, null, null, null, LocalDate.of(2026, 7, 1));
        bookId = bookRepository.save(book).getId();
    }

    @Test
    void 소감_작성_조회_수정_삭제가_동작한다() throws Exception {
        String createBody = objectMapper.writeValueAsString(Map.of("content", "정말 좋은 책이었다."));

        String response = mockMvc.perform(post("/api/books/{bookId}/notes", bookId)
                        .header("Authorization", bearerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.content").value("정말 좋은 책이었다."))
                .andExpect(jsonPath("$.bookId").value(bookId))
                .andReturn().getResponse().getContentAsString();

        Long noteId = objectMapper.readTree(response).get("id").asLong();

        mockMvc.perform(get("/api/books/{bookId}/notes", bookId).header("Authorization", bearerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(noteId));

        String updateBody = objectMapper.writeValueAsString(Map.of("content", "다시 읽어도 좋다."));
        mockMvc.perform(patch("/api/books/{bookId}/notes/{noteId}", bookId, noteId)
                        .header("Authorization", bearerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").value("다시 읽어도 좋다."));

        mockMvc.perform(delete("/api/books/{bookId}/notes/{noteId}", bookId, noteId)
                        .header("Authorization", bearerToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/books/{bookId}/notes", bookId).header("Authorization", bearerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void 존재하지_않는_책의_소감_목록_조회시_404() throws Exception {
        mockMvc.perform(get("/api/books/{bookId}/notes", 999_999L).header("Authorization", bearerToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void 다른_사람의_책에_소감을_작성_수정_삭제하려하면_403() throws Exception {
        User otherUser = new User("다른사람", null, null, null, "kakao", "note-test-other-social-id");
        Long otherUserId = userRepository.save(otherUser).getId();
        String otherToken = "Bearer " + jwtProvider.generateToken(otherUserId);

        String createBody = objectMapper.writeValueAsString(Map.of("content", "남의 책에 몰래 소감 남기기"));
        mockMvc.perform(post("/api/books/{bookId}/notes", bookId)
                        .header("Authorization", otherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("NOT_OWNER"));

        // 내 소감 하나 만들어두고, 다른 사람이 그걸 수정/삭제하려 하면 막혀야 함
        String myBody = objectMapper.writeValueAsString(Map.of("content", "내 소감"));
        String response = mockMvc.perform(post("/api/books/{bookId}/notes", bookId)
                        .header("Authorization", bearerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(myBody))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Long noteId = objectMapper.readTree(response).get("id").asLong();

        mockMvc.perform(patch("/api/books/{bookId}/notes/{noteId}", bookId, noteId)
                        .header("Authorization", otherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("content", "해킹"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("NOT_OWNER"));

        mockMvc.perform(delete("/api/books/{bookId}/notes/{noteId}", bookId, noteId)
                        .header("Authorization", otherToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("NOT_OWNER"));
    }

    @Test
    void 토큰_없이_요청하면_401() throws Exception {
        mockMvc.perform(get("/api/books/{bookId}/notes", bookId))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("UNAUTHENTICATED"));
    }
}
