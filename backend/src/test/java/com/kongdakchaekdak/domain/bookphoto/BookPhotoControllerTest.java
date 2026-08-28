package com.kongdakchaekdak.domain.bookphoto;

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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * S3Presigner는 실제 AWS에 네트워크 요청을 보내지 않고 로컬에서 서명만 계산하므로
 * (src/test/resources/application.yml의 더미 자격증명으로도 충분), 이 테스트는 @MockBean 없이
 * 실제 S3Presigner 빈을 그대로 사용한다.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class BookPhotoControllerTest {

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
        User user = new User("테스터", null, null, null, "kakao", "photo-test-social-id");
        Long userId = userRepository.save(user).getId();
        bearerToken = "Bearer " + jwtProvider.generateToken(userId);

        Book book = new Book(user, "클린 코드", "로버트 마틴", null, null, null, null, LocalDate.of(2026, 7, 1));
        bookId = bookRepository.save(book).getId();
    }

    @Test
    void presigned_url을_정상_발급받는다() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "fileName", "cafe.jpg",
                "contentType", "image/jpeg"
        ));

        mockMvc.perform(post("/api/books/{bookId}/photos/presigned-url", bookId)
                        .header("Authorization", bearerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.uploadUrl").isNotEmpty())
                .andExpect(jsonPath("$.imageUrl").value(org.hamcrest.Matchers.containsString("test-bucket")))
                .andExpect(jsonPath("$.key").value(org.hamcrest.Matchers.startsWith("book-photos/" + bookId + "/")))
                .andExpect(jsonPath("$.expiresInSeconds").value(600));
    }

    @Test
    void 이미지가_아닌_contentType이면_400() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "fileName", "malware.exe",
                "contentType", "application/x-msdownload"
        ));

        mockMvc.perform(post("/api/books/{bookId}/photos/presigned-url", bookId)
                        .header("Authorization", bearerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("VALIDATION_FAILED"));
    }

    @Test
    void 사진_등록_조회_삭제가_동작한다() throws Exception {
        String createBody = objectMapper.writeValueAsString(Map.of(
                "imageUrl", "https://test-bucket.s3.ap-northeast-2.amazonaws.com/book-photos/1/abc.jpg",
                "locationText", "홍대 카페",
                "latitude", 37.556,
                "longitude", 126.923
        ));

        String response = mockMvc.perform(post("/api/books/{bookId}/photos", bookId)
                        .header("Authorization", bearerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.locationText").value("홍대 카페"))
                .andExpect(jsonPath("$.bookId").value(bookId))
                .andReturn().getResponse().getContentAsString();

        Long photoId = objectMapper.readTree(response).get("id").asLong();

        mockMvc.perform(get("/api/books/{bookId}/photos", bookId).header("Authorization", bearerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(photoId));

        mockMvc.perform(delete("/api/books/{bookId}/photos/{photoId}", bookId, photoId)
                        .header("Authorization", bearerToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/books/{bookId}/photos", bookId).header("Authorization", bearerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void 존재하지_않는_책의_사진_목록_조회시_404() throws Exception {
        mockMvc.perform(get("/api/books/{bookId}/photos", 999_999L).header("Authorization", bearerToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void 다른_사람의_책에_사진을_등록하려하면_403() throws Exception {
        User otherUser = new User("다른사람", null, null, null, "kakao", "photo-test-other-social-id");
        Long otherUserId = userRepository.save(otherUser).getId();
        String otherToken = "Bearer " + jwtProvider.generateToken(otherUserId);

        String createBody = objectMapper.writeValueAsString(Map.of(
                "imageUrl", "https://test-bucket.s3.ap-northeast-2.amazonaws.com/book-photos/1/abc.jpg"
        ));

        mockMvc.perform(post("/api/books/{bookId}/photos", bookId)
                        .header("Authorization", otherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("FORBIDDEN"));
    }

    @Test
    void 다른_사람의_책_사진을_삭제하려하면_403() throws Exception {
        String createBody = objectMapper.writeValueAsString(Map.of(
                "imageUrl", "https://test-bucket.s3.ap-northeast-2.amazonaws.com/book-photos/1/abc.jpg"
        ));
        String response = mockMvc.perform(post("/api/books/{bookId}/photos", bookId)
                        .header("Authorization", bearerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Long photoId = objectMapper.readTree(response).get("id").asLong();

        User otherUser = new User("다른사람2", null, null, null, "kakao", "photo-test-other-social-id-2");
        Long otherUserId = userRepository.save(otherUser).getId();
        String otherToken = "Bearer " + jwtProvider.generateToken(otherUserId);

        mockMvc.perform(delete("/api/books/{bookId}/photos/{photoId}", bookId, photoId)
                        .header("Authorization", otherToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("FORBIDDEN"));
    }

    @Test
    void 토큰_없이_요청하면_401() throws Exception {
        mockMvc.perform(get("/api/books/{bookId}/photos", bookId))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("UNAUTHENTICATED"));
    }
}
