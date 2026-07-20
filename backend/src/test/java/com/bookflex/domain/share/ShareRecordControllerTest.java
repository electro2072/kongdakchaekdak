package com.bookflex.domain.share;

import com.bookflex.domain.book.Book;
import com.bookflex.domain.book.BookRepository;
import com.bookflex.domain.bookphoto.BookPhoto;
import com.bookflex.domain.bookphoto.BookPhotoRepository;
import com.bookflex.domain.booknote.BookNote;
import com.bookflex.domain.booknote.BookNoteRepository;
import com.bookflex.domain.group.Group;
import com.bookflex.domain.group.GroupMember;
import com.bookflex.domain.group.GroupMemberRepository;
import com.bookflex.domain.group.GroupRepository;
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

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
                "shareType", "DASHBOARD",
                "scope", "ALL",
                "platform", "APP"
        ));

        String response = mockMvc.perform(post("/api/share-records")
                        .header("Authorization", sharerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.shareType").value("DASHBOARD"))
                .andExpect(jsonPath("$.scope").value("ALL"))
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
                "shareType", "BOOK",
                "scope", "ALL",
                "platform", "APP"
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
                "shareType", "BOOK",
                "bookId", bookId,
                "scope", "ALL",
                "platform", "APP"
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
                "shareType", "DASHBOARD",
                "scope", "CUSTOM",
                "platform", "APP"
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
                "shareType", "DASHBOARD",
                "scope", "GROUP",
                "platform", "APP",
                "targets", List.of(Map.of("targetType", "USER", "targetId", sharerId))
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
                "shareType", "DASHBOARD",
                "scope", "GROUP",
                "platform", "APP",
                "targets", List.of(Map.of("targetType", "GROUP", "targetId", othersGroup.getId()))
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
                "shareType", "DASHBOARD",
                "scope", "GROUP",
                "platform", "APP",
                "targets", List.of(Map.of("targetType", "GROUP", "targetId", myGroupId))
        ));

        mockMvc.perform(post("/api/share-records")
                        .header("Authorization", sharerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.targets[0].targetType").value("GROUP"))
                .andExpect(jsonPath("$.targets[0].targetId").value(myGroupId));
    }

    @Test
    void 공유_기록_삭제는_본인만_가능하다() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "shareType", "DASHBOARD",
                "scope", "ALL",
                "platform", "APP"
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
                "shareType", "BOOK",
                "bookId", bookId,
                "scope", "ALL",
                "platform", "APP",
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
                "shareType", "BOOK",
                "bookId", otherBookId,
                "scope", "ALL",
                "platform", "APP",
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
                "shareType", "DASHBOARD",
                "scope", "ALL",
                "platform", "APP",
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
                "shareType", "BOOK",
                "bookId", otherBookId,
                "scope", "ALL",
                "platform", "APP",
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
                "shareType", "BOOK",
                "bookId", bookId,
                "scope", "ALL",
                "platform", "APP",
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
        Book completedBook = new Book(sharer, "완독한 책", "저자", null, null, "소설",
                200, LocalDate.of(2026, 7, 1));
        completedBook.complete(LocalDate.of(2026, 7, 10));
        bookRepository.save(completedBook);

        String body = objectMapper.writeValueAsString(Map.of(
                "shareType", "DASHBOARD",
                "scope", "ALL",
                "platform", "APP",
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
                "shareType", "BOOK",
                "bookId", bookId,
                "scope", "ALL",
                "platform", "APP",
                "dashboardPeriod", "MONTH"
        ));

        mockMvc.perform(post("/api/share-records")
                        .header("Authorization", sharerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("INVALID_REQUEST"));
    }
}
