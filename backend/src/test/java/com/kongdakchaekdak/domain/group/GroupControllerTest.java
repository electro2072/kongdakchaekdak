package com.kongdakchaekdak.domain.group;

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
class GroupControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtProvider jwtProvider;

    private Long ownerId;
    private String ownerToken;

    @BeforeEach
    void setUp() {
        User owner = new User("모임장", null, null, null, "kakao", "group-test-owner-social-id");
        ownerId = userRepository.save(owner).getId();
        ownerToken = "Bearer " + jwtProvider.generateToken(ownerId);
    }

    @Test
    void 그룹_생성하면_소유자가_자동으로_멤버가_된다() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of("name", "우리 독서모임"));

        String response = mockMvc.perform(post("/api/groups")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("우리 독서모임"))
                .andExpect(jsonPath("$.ownerId").value(ownerId))
                .andExpect(jsonPath("$.memberCount").value(1))
                .andReturn().getResponse().getContentAsString();

        Long groupId = objectMapper.readTree(response).get("id").asLong();

        mockMvc.perform(get("/api/groups/{id}/members", groupId).header("Authorization", ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].userId").value(ownerId));
    }

    @Test
    void 그룹명_수정과_삭제는_소유자만_가능하다() throws Exception {
        Long groupId = createGroup("독서모임");

        User otherUser = new User("다른사람", null, null, null, "kakao", "group-test-other-social-id");
        Long otherUserId = userRepository.save(otherUser).getId();
        String otherToken = "Bearer " + jwtProvider.generateToken(otherUserId);

        mockMvc.perform(patch("/api/groups/{id}", groupId)
                        .header("Authorization", otherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("name", "이름 바꿔치기"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("GROUP_LEADER_ONLY"));

        mockMvc.perform(delete("/api/groups/{id}", groupId).header("Authorization", otherToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("GROUP_LEADER_ONLY"));

        mockMvc.perform(patch("/api/groups/{id}", groupId)
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("name", "새 이름"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("새 이름"));

        mockMvc.perform(delete("/api/groups/{id}", groupId).header("Authorization", ownerToken))
                .andExpect(status().isNoContent());
    }

    @Test
    void 멤버_추가는_소유자만_가능하고_중복_추가하면_409() throws Exception {
        Long groupId = createGroup("독서모임2");

        User member = new User("멤버", null, null, null, "kakao", "group-test-member-social-id");
        Long memberId = userRepository.save(member).getId();

        User otherUser = new User("다른사람2", null, null, null, "kakao", "group-test-other2-social-id");
        Long otherUserId = userRepository.save(otherUser).getId();
        String otherToken = "Bearer " + jwtProvider.generateToken(otherUserId);

        mockMvc.perform(post("/api/groups/{id}/members", groupId)
                        .header("Authorization", otherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("userId", memberId))))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/groups/{id}/members", groupId)
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("userId", memberId))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.userId").value(memberId));

        mockMvc.perform(post("/api/groups/{id}/members", groupId)
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("userId", memberId))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("ALREADY_GROUP_MEMBER"));
    }

    @Test
    void 멤버는_본인_탈퇴가_가능하고_소유자는_탈퇴할_수_없다() throws Exception {
        Long groupId = createGroup("독서모임3");

        User member = new User("멤버2", null, null, null, "kakao", "group-test-member2-social-id");
        Long memberId = userRepository.save(member).getId();
        String memberToken = "Bearer " + jwtProvider.generateToken(memberId);

        mockMvc.perform(post("/api/groups/{id}/members", groupId)
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("userId", memberId))))
                .andExpect(status().isCreated());

        mockMvc.perform(delete("/api/groups/{id}/members/{userId}", groupId, memberId)
                        .header("Authorization", memberToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(delete("/api/groups/{id}/members/{userId}", groupId, ownerId)
                        .header("Authorization", ownerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("GROUP_LEADER_CANNOT_LEAVE"));
    }

    @Test
    void 토큰_없이_요청하면_401() throws Exception {
        mockMvc.perform(get("/api/groups"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("UNAUTHENTICATED"));
    }

    // (G20 확장, 2026-09-10) 회귀 방지 테스트 — 인증만 되어 있으면 자신이 속하지 않은 그룹의
    // 존재/멤버 명단까지 그대로 조회할 수 있던 결함(BUG-20260910-25와 같은 패턴)이 다시 생기지
    // 않는지 확인한다.
    @Test
    void 그룹_멤버가_아니면_단건_조회와_멤버_목록_조회_모두_403() throws Exception {
        Long groupId = createGroup("독서모임4");

        User outsider = new User("비멤버", null, null, null, "kakao", "group-test-outsider-social-id");
        Long outsiderId = userRepository.save(outsider).getId();
        String outsiderToken = "Bearer " + jwtProvider.generateToken(outsiderId);

        mockMvc.perform(get("/api/groups/{id}", groupId).header("Authorization", outsiderToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("NOT_GROUP_MEMBER"));

        mockMvc.perform(get("/api/groups/{id}/members", groupId).header("Authorization", outsiderToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("NOT_GROUP_MEMBER"));
    }

    @Test
    void 목록_조회는_본인이_속한_그룹만_반환한다() throws Exception {
        createGroup("내가_속한_모임");

        User otherOwner = new User("다른모임장", null, null, null, "kakao", "group-test-other-owner-social-id");
        Long otherOwnerId = userRepository.save(otherOwner).getId();
        String otherOwnerToken = "Bearer " + jwtProvider.generateToken(otherOwnerId);
        mockMvc.perform(post("/api/groups")
                        .header("Authorization", otherOwnerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("name", "남의_모임"))))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/groups").header("Authorization", ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("내가_속한_모임"));
    }

    private Long createGroup(String name) throws Exception {
        String response = mockMvc.perform(post("/api/groups")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("name", name))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("id").asLong();
    }
}
