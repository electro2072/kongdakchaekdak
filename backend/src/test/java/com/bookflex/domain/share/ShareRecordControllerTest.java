package com.bookflex.domain.share;

import com.bookflex.domain.book.Book;
import com.bookflex.domain.book.BookRepository;
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
    private GroupRepository groupRepository;

    @Autowired
    private GroupMemberRepository groupMemberRepository;

    @Autowired
    private JwtProvider jwtProvider;

    private Long sharerId;
    private String sharerToken;
    private Long bookId;
    private Long myGroupId;

    @BeforeEach
    void setUp() {
        User sharer = new User("공유자", null, null, null, "kakao", "share-test-sharer-social-id");
        sharerId = userRepository.save(sharer).getId();
        sharerToken = "Bearer " + jwtProvider.generateToken(sharerId);

        Book book = new Book(sharer, "클린 코드", "로버트 마틴", null, null, null, null, LocalDate.of(2026, 7, 1));
        bookId = bookRepository.save(book).getId();

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
}
