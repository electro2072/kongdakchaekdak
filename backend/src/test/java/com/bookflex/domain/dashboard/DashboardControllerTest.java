package com.bookflex.domain.dashboard;

import com.bookflex.domain.book.Book;
import com.bookflex.domain.book.BookRepository;
import com.bookflex.domain.common.Genre;
import com.bookflex.domain.user.User;
import com.bookflex.domain.user.UserRepository;
import com.bookflex.security.JwtProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 테스트 데이터 (2026-07 기준, 전부 이 사용자의 DONE 책):
 * - A: 소설, 300p, 07.01~07.03 (3일, 가장 빨리 읽음)
 * - B: 소설, totalPages 없음, 07.01~07.20 (20일, 가장 오래 읽음)
 * - C: 장르 없음("기타"로 집계), 150p, 07.05~07.10 (6일)
 * - D: 소설, 250p, 06.01~06.15 (15일) — 7월 기간 통계에는 안 잡히지만 추이 그래프 창(월 단위)에는 잡힐 수 있음
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class DashboardControllerTest {

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

    private String bearerToken;

    @BeforeEach
    void setUp() {
        User user = new User("테스터", null, null, null, "kakao", "dashboard-test-social-id");
        Long userId = userRepository.save(user).getId();
        bearerToken = "Bearer " + jwtProvider.generateToken(userId);

        saveCompletedBook(user, "가장 빠른 책", Genre.NOVEL, 300, LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 3));
        saveCompletedBook(user, "가장 느린 책", Genre.NOVEL, null, LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 20));
        saveCompletedBook(user, "장르 없는 책", null, 150, LocalDate.of(2026, 7, 5), LocalDate.of(2026, 7, 10));
        saveCompletedBook(user, "6월 책", Genre.NOVEL, 250, LocalDate.of(2026, 6, 1), LocalDate.of(2026, 6, 15));
    }

    private void saveCompletedBook(User user, String title, Genre genre, Integer totalPages,
                                    LocalDate startDate, LocalDate endDate) {
        Book book = new Book(user, title, "저자", null, null, genre, totalPages, startDate);
        book.complete(endDate);
        bookRepository.save(book);
    }

    @Test
    void 월간_통계가_정확히_집계된다() throws Exception {
        mockMvc.perform(get("/api/dashboard")
                        .param("period", "month")
                        .param("date", "2026-07")
                        .header("Authorization", bearerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.periodLabel").value("2026년 7월"))
                .andExpect(jsonPath("$.completedBookCount").value(3))
                .andExpect(jsonPath("$.totalPagesRead").value(450))
                .andExpect(jsonPath("$.genreRatios[0].genre").value("소설"))
                .andExpect(jsonPath("$.genreRatios[0].count").value(2))
                .andExpect(jsonPath("$.highlights.topGenre").value("소설"))
                .andExpect(jsonPath("$.highlights.longestReadBook.title").value("가장 느린 책"))
                .andExpect(jsonPath("$.highlights.longestReadBook.days").value(20))
                .andExpect(jsonPath("$.highlights.fastestReadBook.title").value("가장 빠른 책"))
                .andExpect(jsonPath("$.highlights.fastestReadBook.days").value(3))
                .andExpect(jsonPath("$.recommendedCaption").value(org.hamcrest.Matchers.containsString("이번 달 3권 완독!")))
                .andExpect(jsonPath("$.monthlyTrend.length()").value(6))
                .andExpect(jsonPath("$.monthlyTrend[5].yearMonth").value("2026-07"))
                .andExpect(jsonPath("$.monthlyTrend[5].completedCount").value(3))
                .andExpect(jsonPath("$.monthlyTrend[4].yearMonth").value("2026-06"))
                .andExpect(jsonPath("$.monthlyTrend[4].completedCount").value(1));
    }

    @Test
    void 분기별_통계는_같은_분기_내_7월_데이터를_포함한다() throws Exception {
        mockMvc.perform(get("/api/dashboard")
                        .param("period", "quarter")
                        .param("date", "2026-07")
                        .header("Authorization", bearerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.periodLabel").value("2026년 3분기"))
                .andExpect(jsonPath("$.completedBookCount").value(3))
                .andExpect(jsonPath("$.startDate").value("2026-07-01"))
                .andExpect(jsonPath("$.endDate").value("2026-09-30"));
    }

    @Test
    void 연간_통계는_6월_책까지_포함하지만_추이그래프는_7월부터만_보여준다() throws Exception {
        mockMvc.perform(get("/api/dashboard")
                        .param("period", "year")
                        .param("date", "2026-07")
                        .header("Authorization", bearerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.periodLabel").value("2026년"))
                .andExpect(jsonPath("$.completedBookCount").value(4))
                .andExpect(jsonPath("$.totalPagesRead").value(700))
                .andExpect(jsonPath("$.monthlyTrend[0].yearMonth").value("2026-07"))
                .andExpect(jsonPath("$.monthlyTrend[0].completedCount").value(3))
                .andExpect(jsonPath("$.monthlyTrend.length()").value(6));
    }

    @Test
    void 완독한_책이_없는_기간은_0으로_응답하고_격려_문구를_보여준다() throws Exception {
        mockMvc.perform(get("/api/dashboard")
                        .param("period", "month")
                        .param("date", "2020-01")
                        .header("Authorization", bearerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completedBookCount").value(0))
                .andExpect(jsonPath("$.totalPagesRead").value(0))
                .andExpect(jsonPath("$.genreRatios").isEmpty())
                .andExpect(jsonPath("$.highlights.topGenre").doesNotExist())
                .andExpect(jsonPath("$.recommendedCaption").value(org.hamcrest.Matchers.containsString("완독한 책이 없어요")));
    }

    @Test
    void date를_생략하면_이번_달_기준으로_동작한다() throws Exception {
        mockMvc.perform(get("/api/dashboard").header("Authorization", bearerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.period").value("MONTH"));
    }

    @Test
    void 토큰_없이_요청하면_401() throws Exception {
        mockMvc.perform(get("/api/dashboard").param("period", "month").param("date", "2026-07"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("UNAUTHENTICATED"));
    }
}
