package com.kongdakchaekdak.domain.user;

import com.kongdakchaekdak.domain.book.Book;
import com.kongdakchaekdak.domain.book.BookRepository;
import com.kongdakchaekdak.domain.booknote.BookNote;
import com.kongdakchaekdak.domain.booknote.BookNoteRepository;
import com.kongdakchaekdak.domain.bookphoto.BookPhoto;
import com.kongdakchaekdak.domain.bookphoto.BookPhotoRepository;
import com.kongdakchaekdak.domain.common.Genre;
import com.kongdakchaekdak.domain.group.Group;
import com.kongdakchaekdak.domain.group.GroupMember;
import com.kongdakchaekdak.domain.group.GroupMemberRepository;
import com.kongdakchaekdak.domain.group.GroupRepository;
import com.kongdakchaekdak.domain.share.SharePlatform;
import com.kongdakchaekdak.domain.share.ShareRecord;
import com.kongdakchaekdak.domain.share.ShareRecordPhoto;
import com.kongdakchaekdak.domain.share.ShareRecordPhotoRepository;
import com.kongdakchaekdak.domain.share.ShareRecordRepository;
import com.kongdakchaekdak.domain.share.ShareRecordTarget;
import com.kongdakchaekdak.domain.share.ShareRecordTargetRepository;
import com.kongdakchaekdak.domain.share.ShareScope;
import com.kongdakchaekdak.domain.share.ShareTargetType;
import com.kongdakchaekdak.domain.share.ShareType;
import com.kongdakchaekdak.security.JwtProvider;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * (G16 회원 탈퇴, 2026-09-11) {@code DELETE /api/users/{id}}(#10) 통합 테스트.
 *
 * <p>테스트 트랜잭션은 롤백되므로 커밋 후 스토리지 삭제는 여기서 실행되지 않는다 — 그 경로는
 * {@code AccountDeletionStorageFailureTest}·{@code AccountDeletionWithoutStorageCredentialsTest}가 커밋까지
 * 태워서 검증한다.
 *
 * <p>검증 전에 반드시 {@code flushAndClear()}를 부른다. 1차 캐시에 남은 엔티티를 읽으면 SQL이 실제로
 * 성공했는지(FK 위반이 없는지) 확인하지 못한 채 통과할 수 있기 때문이다.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AccountDeletionTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private JwtProvider jwtProvider;
    @Autowired
    private JdbcTemplate jdbcTemplate;
    @PersistenceContext
    private EntityManager entityManager;

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
    private ShareRecordTargetRepository shareRecordTargetRepository;
    @Autowired
    private ShareRecordPhotoRepository shareRecordPhotoRepository;
    @Autowired
    private GroupRepository groupRepository;
    @Autowired
    private GroupMemberRepository groupMemberRepository;

    @Test
    void 책_소감_사진_공유_그룹멤버를_가진_사용자가_탈퇴하면_전부_삭제되고_공개링크도_막힌다() throws Exception {
        User me = newUser("탈퇴자", "withdraw-full-me");
        me.updateInterests(Set.of(Genre.NOVEL, Genre.SCIENCE));
        me = userRepository.save(me);
        User other = userRepository.save(newUser("남아있는사람", "withdraw-full-other"));

        Book myBook = bookRepository.save(new Book(me, "탈퇴자의 책", "저자", null, null, Genre.NOVEL, 200,
                LocalDate.of(2026, 9, 1)));
        BookNote myNote = bookNoteRepository.save(new BookNote(myBook, "탈퇴자가 남긴 소감"));
        BookPhoto myPhoto = bookPhotoRepository.save(new BookPhoto(myBook,
                "https://test-bucket.s3.ap-northeast-2.amazonaws.com/book-photos/" + myBook.getId() + "/"
                        + UUID.randomUUID() + ".jpg",
                "동네 카페", new BigDecimal("37.566500"), new BigDecimal("126.978000")));

        String myToken = UUID.randomUUID().toString();
        ShareRecord myShare = shareRecordRepository.save(new ShareRecord(me, myBook, ShareType.BOOK, ShareScope.CUSTOM,
                SharePlatform.APP, null, myToken, myNote, null));
        ShareRecordTarget myShareTarget = shareRecordTargetRepository.save(
                new ShareRecordTarget(myShare, ShareTargetType.USER, other.getId()));
        ShareRecordPhoto myShareSelectedPhoto = shareRecordPhotoRepository.save(new ShareRecordPhoto(myShare, myPhoto, 0));

        // 남의 데이터 — 탈퇴자를 공유 대상으로 지정한 행만 사라지고 나머지는 그대로여야 한다.
        Book othersBook = bookRepository.save(new Book(other, "남의 책", "저자2", null, null, null, null,
                LocalDate.of(2026, 9, 1)));
        ShareRecord othersShare = shareRecordRepository.save(new ShareRecord(other, othersBook, ShareType.BOOK,
                ShareScope.CUSTOM, SharePlatform.APP, null, UUID.randomUUID().toString(), null, null));
        ShareRecordTarget targetPointingToMe = shareRecordTargetRepository.save(
                new ShareRecordTarget(othersShare, ShareTargetType.USER, me.getId()));

        // 남이 모임장인 그룹에 멤버로 참여 — 멤버십만 사라지고 그룹·모임장은 그대로여야 한다.
        Group othersGroup = groupRepository.save(new Group(other, "남의 모임"));
        groupMemberRepository.save(new GroupMember(othersGroup, other));
        groupMemberRepository.save(new GroupMember(othersGroup, me));

        flushAndClear();

        // 전제 확인: 탈퇴 전에는 공개 링크가 콘텐츠를 보여준다(아래 404 단언이 의미 있음을 보장).
        mockMvc.perform(get("/public/share/{token}", myToken))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("탈퇴자의 책")));

        mockMvc.perform(delete("/api/users/{id}", me.getId()).header("Authorization", bearer(me)))
                .andExpect(status().isNoContent())
                .andExpect(content().string(""));

        flushAndClear();
        Long meId = me.getId();

        assertThat(userRepository.existsById(meId)).isFalse();
        assertThat(jdbcTemplate.queryForObject("select count(*) from user_interests where user_id = ?", Long.class, meId))
                .isZero();
        assertThat(bookRepository.findByUserId(meId)).isEmpty();
        assertThat(bookNoteRepository.existsById(myNote.getId())).isFalse();
        assertThat(bookPhotoRepository.existsById(myPhoto.getId())).isFalse();
        assertThat(shareRecordRepository.existsById(myShare.getId())).isFalse();
        assertThat(shareRecordTargetRepository.existsById(myShareTarget.getId())).isFalse();
        assertThat(shareRecordPhotoRepository.existsById(myShareSelectedPhoto.getId())).isFalse();
        assertThat(shareRecordTargetRepository.existsById(targetPointingToMe.getId())).isFalse();
        assertThat(groupMemberRepository.existsByGroupIdAndUserId(othersGroup.getId(), meId)).isFalse();

        assertThat(userRepository.existsById(other.getId())).isTrue();
        assertThat(bookRepository.existsById(othersBook.getId())).isTrue();
        assertThat(shareRecordRepository.existsById(othersShare.getId())).isTrue();
        assertThat(groupRepository.findById(othersGroup.getId()).orElseThrow().getOwner().getId())
                .isEqualTo(other.getId());
        assertThat(groupMemberRepository.countByGroupId(othersGroup.getId())).isEqualTo(1);

        // 수용 기준 3: 탈퇴 전 공개 링크에 콘텐츠가 보이지 않는다.
        mockMvc.perform(get("/public/share/{token}", myToken))
                .andExpect(status().isNotFound())
                .andExpect(content().string(not(containsString("탈퇴자의 책"))))
                .andExpect(content().string(not(containsString("탈퇴자가 남긴 소감"))))
                .andExpect(content().string(not(containsString("탈퇴자"))));
    }

    @Test
    void 모임장이_탈퇴하면_본인을_제외하고_joined_at이_가장_이른_멤버가_모임장이_된다() throws Exception {
        User owner = userRepository.save(newUser("모임장", "withdraw-transfer-owner"));
        User earlierIdLaterJoin = userRepository.save(newUser("id는빠르고가입은늦음", "withdraw-transfer-a"));
        User laterIdEarlierJoin = userRepository.save(newUser("id는늦고가입은빠름", "withdraw-transfer-b"));

        Group group = groupRepository.save(new Group(owner, "위임될 모임"));
        GroupMember ownerRow = groupMemberRepository.save(new GroupMember(group, owner));
        GroupMember rowA = groupMemberRepository.save(new GroupMember(group, earlierIdLaterJoin));
        GroupMember rowB = groupMemberRepository.save(new GroupMember(group, laterIdEarlierJoin));
        flushAndClear();

        // id 순서(A < B)와 가입 순서(B가 먼저)를 일부러 엇갈리게 한다 — joined_at이 우선임을 확인.
        setJoinedAt(ownerRow, LocalDateTime.of(2026, 9, 1, 10, 0));
        setJoinedAt(rowB, LocalDateTime.of(2026, 9, 1, 10, 5));
        setJoinedAt(rowA, LocalDateTime.of(2026, 9, 1, 10, 10));
        flushAndClear();

        mockMvc.perform(delete("/api/users/{id}", owner.getId()).header("Authorization", bearer(owner)))
                .andExpect(status().isNoContent());
        flushAndClear();

        assertThat(groupRepository.findById(group.getId()).orElseThrow().getOwner().getId())
                .isEqualTo(laterIdEarlierJoin.getId());
        assertThat(groupMemberRepository.existsByGroupIdAndUserId(group.getId(), owner.getId())).isFalse();
        assertThat(groupMemberRepository.countByGroupId(group.getId())).isEqualTo(2);
        assertThat(userRepository.existsById(owner.getId())).isFalse();
    }

    @Test
    void 가입_시각이_같으면_id가_작은_멤버가_모임장이_되고_모임장_본인_행은_건너뛴다() throws Exception {
        User owner = userRepository.save(newUser("모임장2", "withdraw-tie-owner"));
        User first = userRepository.save(newUser("먼저저장", "withdraw-tie-first"));
        User second = userRepository.save(newUser("나중저장", "withdraw-tie-second"));

        Group group = groupRepository.save(new Group(owner, "동시 가입 모임"));
        GroupMember ownerRow = groupMemberRepository.save(new GroupMember(group, owner));
        GroupMember firstRow = groupMemberRepository.save(new GroupMember(group, first));
        GroupMember secondRow = groupMemberRepository.save(new GroupMember(group, second));
        flushAndClear();

        // 모임장 본인 행이 가장 작은 id + 같은 시각 — 본인을 "다음 멤버"로 고르면 안 된다.
        LocalDateTime sameMoment = LocalDateTime.of(2026, 9, 1, 12, 0);
        setJoinedAt(ownerRow, sameMoment);
        setJoinedAt(firstRow, sameMoment);
        setJoinedAt(secondRow, sameMoment);
        flushAndClear();
        assertThat(ownerRow.getId()).isLessThan(firstRow.getId());
        assertThat(firstRow.getId()).isLessThan(secondRow.getId());

        mockMvc.perform(delete("/api/users/{id}", owner.getId()).header("Authorization", bearer(owner)))
                .andExpect(status().isNoContent());
        flushAndClear();

        assertThat(groupRepository.findById(group.getId()).orElseThrow().getOwner().getId())
                .isEqualTo(first.getId());
    }

    @Test
    void 혼자인_모임의_모임장이_탈퇴하면_모임이_삭제된다() throws Exception {
        User owner = userRepository.save(newUser("혼자모임장", "withdraw-solo-owner"));
        Group soloGroup = groupRepository.save(new Group(owner, "나 혼자 모임"));
        groupMemberRepository.save(new GroupMember(soloGroup, owner));
        flushAndClear();

        mockMvc.perform(delete("/api/users/{id}", owner.getId()).header("Authorization", bearer(owner)))
                .andExpect(status().isNoContent());
        flushAndClear();

        assertThat(groupRepository.existsById(soloGroup.getId())).isFalse();
        assertThat(groupMemberRepository.countByGroupId(soloGroup.getId())).isZero();
        assertThat(userRepository.existsById(owner.getId())).isFalse();
    }

    @Test
    void 다른_사람의_id로_탈퇴를_요청하면_403이고_아무것도_지워지지_않는다() throws Exception {
        User victim = userRepository.save(newUser("피해자", "withdraw-403-victim"));
        User attacker = userRepository.save(newUser("공격자", "withdraw-403-attacker"));
        Book victimBook = bookRepository.save(new Book(victim, "지켜져야 할 책", "저자", null, null, null, null,
                LocalDate.of(2026, 9, 1)));
        flushAndClear();

        mockMvc.perform(delete("/api/users/{id}", victim.getId()).header("Authorization", bearer(attacker)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("NOT_OWNER"));
        flushAndClear();

        assertThat(userRepository.existsById(victim.getId())).isTrue();
        assertThat(bookRepository.existsById(victimBook.getId())).isTrue();
        assertThat(userRepository.existsById(attacker.getId())).isTrue();
    }

    @Test
    void 탈퇴_후_기존_토큰으로_호출하면_401() throws Exception {
        User me = userRepository.save(newUser("토큰주인", "withdraw-token-me"));
        bookRepository.save(new Book(me, "토큰주인의 책", "저자", null, null, null, null, LocalDate.of(2026, 9, 1)));
        flushAndClear();
        String token = bearer(me);

        mockMvc.perform(get("/api/auth/me").header("Authorization", token))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/users/{id}", me.getId()).header("Authorization", token))
                .andExpect(status().isNoContent());
        flushAndClear();

        mockMvc.perform(get("/api/auth/me").header("Authorization", token))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("UNAUTHENTICATED"));
        // 예전엔 만료 전까지 인증이 통과해 빈 목록 200이었다.
        mockMvc.perform(get("/api/books").header("Authorization", token))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("UNAUTHENTICATED"));
        mockMvc.perform(delete("/api/users/{id}", me.getId()).header("Authorization", token))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("UNAUTHENTICATED"));
    }

    private User newUser(String nickname, String socialId) {
        return new User(nickname, null, null, null, "kakao", socialId);
    }

    private String bearer(User user) {
        return "Bearer " + jwtProvider.generateToken(user.getId());
    }

    private void flushAndClear() {
        entityManager.flush();
        entityManager.clear();
    }

    private void setJoinedAt(GroupMember member, LocalDateTime joinedAt) {
        int updated = jdbcTemplate.update("update group_members set joined_at = ? where id = ?",
                Timestamp.valueOf(joinedAt), member.getId());
        assertThat(updated).isEqualTo(1);
    }
}
