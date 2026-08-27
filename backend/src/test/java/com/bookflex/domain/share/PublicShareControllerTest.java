package com.bookflex.domain.share;

import com.bookflex.domain.book.Book;
import com.bookflex.domain.book.BookRepository;
import com.bookflex.domain.booknote.BookNote;
import com.bookflex.domain.booknote.BookNoteRepository;
import com.bookflex.domain.bookphoto.BookPhoto;
import com.bookflex.domain.bookphoto.BookPhotoRepository;
import com.bookflex.domain.common.Genre;
import com.bookflex.domain.share.dto.DashboardSnapshotResponse;
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

import java.time.LocalDate;
import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Step 5-2 공개 웹뷰(/public/share/{token}) 테스트 — 전부 Authorization 헤더 없이 호출한다
 * (비로그인 접근이 핵심 요구사항이라 인증 헤더를 아예 사용하지 않는 것 자체가 테스트 포인트).
 * ShareRecordService.create()를 거치지 않고 리포지토리로 ShareRecord를 직접 저장해서,
 * 이 테스트가 공개 웹뷰 렌더링 로직만 독립적으로 검증하도록 한다.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class PublicShareControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private BookNoteRepository bookNoteRepository;

    @Autowired
    private BookPhotoRepository bookPhotoRepository;

    @Autowired
    private ShareRecordRepository shareRecordRepository;

    @Autowired
    private ShareRecordPhotoRepository shareRecordPhotoRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private User sharer;
    private Book book;

    @BeforeEach
    void setUp() {
        sharer = userRepository.save(new User("책벌레", null, null, null, "kakao", "public-share-test-social-id"));
        book = new Book(sharer, "달러구트 꿈 백화점", "이미예", "https://example.com/cover.jpg",
                null, Genre.NOVEL, 300, LocalDate.of(2026, 7, 1));
        book.complete(LocalDate.of(2026, 7, 9));
        book = bookRepository.save(book);
    }

    @Test
    void 존재하는_토큰으로_BOOK_공유_페이지에_로그인없이_접근하면_표지와_소감과_OG_태그가_노출된다() throws Exception {
        BookNote note = bookNoteRepository.save(new BookNote(book, "정말 따뜻한 이야기였다."));
        BookPhoto photo = bookPhotoRepository.save(new BookPhoto(book, "https://example.com/photo1.jpg", null, null, null));

        ShareRecord record = new ShareRecord(sharer, book, ShareType.BOOK, ShareScope.ALL,
                SharePlatform.APP, null, UUID.randomUUID().toString(), note, null);
        record = shareRecordRepository.save(record);
        shareRecordPhotoRepository.save(new ShareRecordPhoto(record, photo, 0));

        mockMvc.perform(get("/public/share/{token}", record.getPublicToken()))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_HTML))
                .andExpect(content().string(containsString("달러구트 꿈 백화점")))
                .andExpect(content().string(containsString("이미예")))
                .andExpect(content().string(containsString("정말 따뜻한 이야기였다.")))
                .andExpect(content().string(containsString("og:title")))
                .andExpect(content().string(containsString("https://example.com/photo1.jpg")));
    }

    @Test
    void scope가_GROUP이어도_토큰만_알면_비로그인으로_접근_가능하다() throws Exception {
        ShareRecord record = new ShareRecord(sharer, book, ShareType.BOOK, ShareScope.GROUP,
                SharePlatform.APP, null, UUID.randomUUID().toString(), null, null);
        shareRecordRepository.save(record);

        mockMvc.perform(get("/public/share/{token}", record.getPublicToken()))
                .andExpect(status().isOk());
    }

    @Test
    void DASHBOARD_공유_페이지는_스냅샷_내용을_그대로_보여준다() throws Exception {
        DashboardSnapshotResponse snapshot =
                new DashboardSnapshotResponse("2026년 7월", 3, 450, "소설", "이번 달 3권 완독!");
        String snapshotJson = objectMapper.writeValueAsString(snapshot);

        ShareRecord record = new ShareRecord(sharer, null, ShareType.DASHBOARD, ShareScope.ALL,
                SharePlatform.APP, null, UUID.randomUUID().toString(), null, snapshotJson);
        shareRecordRepository.save(record);

        mockMvc.perform(get("/public/share/{token}", record.getPublicToken()))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("2026년 7월")))
                .andExpect(content().string(containsString("이번 달 3권 완독!")))
                .andExpect(content().string(containsString("책벌레")));
    }

    @Test
    void 존재하지_않는_토큰이면_404() throws Exception {
        mockMvc.perform(get("/public/share/{token}", "not-a-real-token"))
                .andExpect(status().isNotFound())
                .andExpect(content().string(containsString("찾을 수 없")));
    }

    @Test
    void 닉네임이_없으면_익명의_독서가로_표시된다() throws Exception {
        User anonymousUser = userRepository.save(new User(null, null, null, null, "kakao", "anon-social-id"));
        Book anonBook = bookRepository.save(new Book(anonymousUser, "무명의 책", "무명 저자", null, null, null, null,
                LocalDate.of(2026, 7, 1)));
        ShareRecord record = new ShareRecord(anonymousUser, anonBook, ShareType.BOOK, ShareScope.ALL,
                SharePlatform.APP, null, UUID.randomUUID().toString(), null, null);
        shareRecordRepository.save(record);

        mockMvc.perform(get("/public/share/{token}", record.getPublicToken()))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("익명의 독서가")));
    }
}
