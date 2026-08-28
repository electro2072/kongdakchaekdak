package com.kongdakchaekdak.domain.share;

import com.kongdakchaekdak.domain.book.Book;
import com.kongdakchaekdak.domain.book.BookRepository;
import com.kongdakchaekdak.domain.bookphoto.BookPhoto;
import com.kongdakchaekdak.domain.bookphoto.BookPhotoRepository;
import com.kongdakchaekdak.domain.booknote.BookNote;
import com.kongdakchaekdak.domain.booknote.BookNoteRepository;
import com.kongdakchaekdak.domain.common.Genre;
import com.kongdakchaekdak.domain.group.Group;
import com.kongdakchaekdak.domain.group.GroupMember;
import com.kongdakchaekdak.domain.group.GroupMemberRepository;
import com.kongdakchaekdak.domain.group.GroupRepository;
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
import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * (2026-08-28) shareType/scope/platform/targetType 요청·응답 값을 전부 소문자로 바꿨다
 * (FINDING-20260827-04 수정 — ShareType/ShareScope/SharePlatform/ShareTargetType에
 * {@code @JsonValue}/{@code @JsonCreator} 추가). 이전엔 대문자만 받아들였는데 지금은 반대로
 * 소문자만 받아들인다 — 마지막의 {@code shareType을_대문자로_보내면_400()}가 그 회귀를 막는다.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ShareRecordControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private BookNoteRepository bookNoteRepository;

    @Autowired
    private BookPhotoRepository bookPhotoRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private GroupMemberRepository groupMemberRepository;

    @Autowired
    private JwtProvider jwtProvider;

    private Long sharerId;
    private String sharerToken;
    private Long bookId;
    private Long myGroupId;
    private Long noteId;
    private Long photoId;

    @BeforeEach
    void setUp() {
        User sharer = new User("공유자", null, null, null, "kakao", "share-test-sharer-social-id");
        sharerId = userRepository.save(sharer).getId();
        sharerToken = "Bearer " + jwtProvider.generateToken(sharerId);

        Book book = new Book(sharer, "클린 코드", "로버트 마틴", null, null, null, null, LocalDate.of(2026, 7, 1));
        bookId = bookRepository.save(book).getId();

        noteId = bookNoteRepository.save(new BookNote(book, "인상 깊은 챕터였다.")).getId();
        photoId = bookPhotoRepository.save(new BookPhoto(book, "https://example.com/photo.jpg", null, null, null)).getId();

        Group group = groupRepository.save(new Group(sharer, "내 그룹"));
        groupMemberRepository.save(new GroupMember(group, sharer));
        myGroupId = group.getId();
    }

    @Test
    void scope가_ALL이면_targets_없이_공유_생성과_목록조회가_동작한다() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "shareType", "dashboard",
                "scope", "all",
                "platform", "app"
        ));

        String response = mockMvc.perform(post("/api/share-records")
                        .header("Authorization", sharerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.shareType").value("dashboard"))
                .andExpect(jsonPath("$.scope").value("all"))
                .andExpect(jsonPath("$.publicToken").isNotEmpty())
                .andExpect(jsonPath("$.targets").isEmpty())
                .andReturn().getResponse().getContentAsString();

        Long recordId = objectMapper.readTree(response).get("id").asLong();

        mockMvc.perform(get("/api/share-records").header("Authorization", sharerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(recordId));
    }

    @Test
    void shareType이_BOOK인데_bookId가_없으면_400() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "shareType", "book",
                "scope", "all",
                "platform", "app"
        ));

        mockMvc.perform(post("/api/share-records")
                        .header("Authorization", sharerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("INVALID_REQUEST"));
    }

    @Test
    void 남의_책을_공유하려하면_403() throws Exception {
        User otherUser = new User("다른사람", null, null, null, "kakao", "share-test-other-social-id");
        Long otherUserId = userRepository.save(otherUser).getId();
        String otherToken = "Bearer " + jwtProvider.generateToken(otherUserId);

        String body = objectMapper.writeValueAsString(Map.of(
                "shareType", "book",
                "bookId", bookId,
                "scope", "all",
                "platform", "app"
        ));

        mockMvc.perform(post("/api/share-records")
                        .header("Authorization", otherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("FORBIDDEN"));
    }

    @Test
    void scope가_CUSTOM인데_targets가_없으면_400() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "shareType", "dashboard",
                "scope", "custom",
                "platform", "app"
        ));

        mockMvc.perform(post("/api/share-records")
                        .header("Authorization", sharerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("INVALID_REQUEST"));
    }

    @Test
    void scope가_GROUP인데_targetType에_USER가_섞이면_400() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "shareType", "dashboard",
                "scope", "group",
                "platform", "app",
                "targets", List.of(Map.of("targetType", "user", "targetId", sharerId))
        ));

        mockMvc.perform(post("/api/share-records")
                        .header("Authorization", sharerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("INVALID_REQUEST"));
    }

    @Test
    void 본인이_속하지_않은_그룹에_공유하려하면_403() throws Exception {
        User otherUser = new User("다른사람2", null, null, null, "kakao", "share-test-other2-social-id");
        User otherOwner = userRepository.save(otherUser);
        Group othersGroup = groupRepository.save(new Group(otherOwner, "남의 그룹"));
        groupMemberRepository.save(new GroupMember(othersGroup, otherOwner));

        String body = objectMapper.writeValueAsString(Map.of(
                "shareType", "dashboard",
                "scope", "group",
                "platform", "app",
                "targets", List.of(Map.of("targetType", "group", "targetId", othersGroup.getId()))
        ));

        mockMvc.perform(post("/api/share-records")
                        .header("Authorization", sharerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("FORBIDDEN"));
    }

    @Test
    void 그룹_scope_공유가_정상_생성된다() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "shareType", "dashboard",
                "scope", "group",
                "platform", "app",
                "targets", List.of(Map.of("targetType", "group", "targetId", myGroupId))
        ));

        mockMvc.perform(post("/api/share-records")
                        .header("Authorization", sharerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.targets[0].targetType").value("group"))
                .andExpect(jsonPath("$.targets[0].targetId").value(myGroupId));
    }

    @Test
    void 공유_기록_삭제는_본인만_가능하다() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "shareType", "dashboard",
                "scope", "all",
                "platform", "app"
        ));
        String response = mockMvc.perform(post("/api/share-records")
                        .header("Authorization", sharerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Long recordId = objectMapper.readTree(response).get("id").asLong();

        User otherUser = new User("다른사람3", null, null, null, "kakao", "share-test-other3-social-id");
        Long otherUserId = userRepository.save(otherUser).getId();
        String otherToken = "Bearer " + jwtProvider.generateToken(otherUserId);

        mockMvc.perform(delete("/api/share-records/{id}", recordId).header("Authorization", otherToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("FORBIDDEN"));

        mockMvc.perform(delete("/api/share-records/{id}", recordId).header("Authorization", sharerToken))
                .andExpect(status().isNoContent());
    }

    @Test
    void 토큰_없이_요청하면_401() throws Exception {
        mockMvc.perform(get("/api/share-records"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("UNAUTHENTICATED"));
    }

    @Test
    void bookNoteId와_photoIds를_지정하면_응답에_소감과_사진이_순서대로_포함된다() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "shareType", "book",
                "bookId", bookId,
                "scope", "all",
                "platform", "app",
                "bookNoteId", noteId,
                "photoIds", List.of(photoId)
        ));

        mockMvc.perform(post("/api/share-records")
                        .header("Authorization", sharerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.note.noteId").value(noteId))
                .andExpect(jsonPath("$.note.content").value("인상 깊은 챕터였다."))
                .andExpect(jsonPath("$.photos[0].photoId").value(photoId))
                .andExpect(jsonPath("$.photos[0].imageUrl").value("https://example.com/photo.jpg"))
                .andExpect(jsonPath("$.photos[0].displayOrder").value(0));
    }

    @Test
    void bookNoteId가_다른_책_소감이면_400() throws Exception {
        User sharer = userRepository.findById(sharerId).orElseThrow();
        Book otherBook = new Book(sharer, "다른 책", "다른 저자", null, null, null, null, LocalDate.of(2026, 7, 1));
        Long otherBookId = bookRepository.save(otherBook).getId();
        Long otherNoteId = bookNoteRepository.save(new BookNote(otherBook, "다른 책 소감")).getId();

        String body = objectMapper.writeValueAsString(Map.of(
                "shareType", "book",
                "bookId", otherBookId,
                "scope", "all",
                "platform", "app",
                "bookNoteId", noteId
        ));

        mockMvc.perform(post("/api/share-records")
                        .header("Authorization", sharerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("INVALID_REQUEST"));
    }

    @Test
    void shareType이_DASHBOARD인데_bookNoteId가_있으면_400() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "shareType", "dashboard",
                "scope", "all",
                "platform", "app",
                "bookNoteId", noteId
        ));

        mockMvc.perform(post("/api/share-records")
                        .header("Authorization", sharerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("INVALID_REQUEST"));
    }

    @Test
    void photoIds가_다른_책_사진이면_400() throws Exception {
        User sharer = userRepository.findById(sharerId).orElseThrow();
        Book otherBook = new Book(sharer, "다른 책", "다른 저자", null, null, null, null, LocalDate.of(2026, 7, 1));
        Long otherBookId = bookRepository.save(otherBook).getId();
        Long otherPhotoId = bookPhotoRepository.save(
                new BookPhoto(otherBook, "https://example.com/other.jpg", null, null, null)).getId();

        String body = objectMapper.writeValueAsString(Map.of(
                "shareType", "book",
                "bookId", otherBookId,
                "scope", "all",
                "platform", "app",
                "photoIds", List.of(otherPhotoId, photoId)
        ));

        mockMvc.perform(post("/api/share-records")
                        .header("Authorization", sharerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("INVALID_REQUEST"));
    }

    @Test
    void photoIds가_10장을_넘으면_400() throws Exception {
        List<Long> elevenPhotoIds = new java.util.ArrayList<>();
        for (int i = 0; i < 11; i++) {
            elevenPhotoIds.add(photoId);
        }

        String body = objectMapper.writeValueAsString(Map.of(
                "shareType", "book",
                "bookId", bookId,
                "scope", "all",
                "platform", "app",
                "photoIds", elevenPhotoIds
        ));

        mockMvc.perform(post("/api/share-records")
                        .header("Authorization", sharerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("INVALID_REQUEST"));
    }

    @Test
    void DASHBOARD_공유시_대시보드_스냅샷이_저장된다() throws Exception {
        User sharer = userRepository.findById(sharerId).orElseThrow();
        Book completedBook = new Book(sharer, "완독한 책", "저자", null, null, Genre.NOVEL,
                200, LocalDate.of(2026, 7, 1));
        completedBook.complete(LocalDate.of(2026, 7, 10));
        bookRepository.save(completedBook);

        String body = objectMapper.writeValueAsString(Map.of(
                "shareType", "dashboard",
                "scope", "all",
                "platform", "app",
                "dashboardPeriod", "MONTH",
                "dashboardDate", "2026-07"
        ));

        mockMvc.perform(post("/api/share-records")
                        .header("Authorization", sharerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.dashboardSnapshot.periodLabel").value("2026년 7월"))
                .andExpect(jsonPath("$.dashboardSnapshot.completedBookCount").value(1))
                .andExpect(jsonPath("$.dashboardSnapshot.totalPagesRead").value(200))
                .andExpect(jsonPath("$.dashboardSnapshot.topGenre").value("소설"));
    }

    @Test
    void shareType이_BOOK인데_dashboardPeriod가_있으면_400() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "shareType", "book",
                "bookId", bookId,
                "scope", "all",
                "platform", "app",
                "dashboardPeriod", "MONTH"
        ));

        mockMvc.perform(post("/api/share-records")
                        .header("Authorization", sharerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("INVALID_REQUEST"));
    }

    @Test
    void shareType을_대문자로_보내면_400() throws Exception {
        // 2026-08-28: FINDING-20260827-04 수정 — API 계약을 소문자로 통일했다(Genre와 동일 패턴).
        // 이전엔 대문자만 받아들였는데(프론트 타입/문서와 불일치), 지금은 반대로 대문자를 거부해서
        // 계약이 소문자 하나로 고정됐는지 회귀 방지한다.
        String body = objectMapper.writeValueAsString(Map.of(
                "shareType", "DASHBOARD",
                "scope", "all",
                "platform", "app"
        ));

        mockMvc.perform(post("/api/share-records")
                        .header("Authorization", sharerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("MALFORMED_REQUEST"));
    }
}
