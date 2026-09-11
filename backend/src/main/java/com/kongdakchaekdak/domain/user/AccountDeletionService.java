package com.kongdakchaekdak.domain.user;

import com.kongdakchaekdak.common.logging.AuditLogger;
import com.kongdakchaekdak.domain.book.BookRepository;
import com.kongdakchaekdak.domain.booknote.BookNoteRepository;
import com.kongdakchaekdak.domain.bookphoto.BookPhotoObjectKeys;
import com.kongdakchaekdak.domain.bookphoto.BookPhotoRepository;
import com.kongdakchaekdak.domain.group.Group;
import com.kongdakchaekdak.domain.group.GroupMember;
import com.kongdakchaekdak.domain.group.GroupMemberRepository;
import com.kongdakchaekdak.domain.group.GroupRepository;
import com.kongdakchaekdak.domain.share.ShareRecordPhotoRepository;
import com.kongdakchaekdak.domain.share.ShareRecordRepository;
import com.kongdakchaekdak.domain.share.ShareRecordTargetRepository;
import com.kongdakchaekdak.domain.share.ShareTargetType;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * (G16 회원 탈퇴, 2026-09-11) 사용자 한 명의 소유 데이터를 <b>한 트랜잭션</b>으로 삭제한다.
 *
 * <p>근거: {@code ACCOUNT_DELETION.md}(공지된 약속), {@code docs/콩닥책닥_기능추가요청_회원탈퇴_v1.md}
 * §4 삭제 스펙·§5 수용 기준, 연동매트릭스 G16/D3. 진입점은 기존 {@code DELETE /api/users/{id}}(#10)이고
 * 소유자 검증은 {@link UserService#delete}가 먼저 한다.
 *
 * <p><b>삭제 순서는 FK 방향을 따른다</b>(자식 → 부모). 엔티티 간 cascade가 하나도 없어서 순서를
 * 틀리면 FK 위반으로 전체가 롤백된다 — 기존 {@code userRepository.delete(user)} 한 줄이 책을 한 권이라도
 * 가진 사용자에게 실패하던 이유가 이것이다.
 * <ol>
 *   <li>공유 기록(+사진 연결·대상) — 본인이 만든 것 전부. 공개 링크 {@code /public/share/{token}}은
 *       행이 없으면 404 페이지를 내므로 삭제가 곧 접근 차단이다(수용 기준 3). PM 결정: 익명화가 아니라 완전 삭제.</li>
 *   <li>타인의 공유 기록 중 탈퇴자를 대상(USER)으로 지정한 행</li>
 *   <li>책 사진 → 소감 → 책</li>
 *   <li>그룹 — 모임장이면 위임 또는 삭제(아래), 멤버십은 전부 삭제</li>
 *   <li>사용자 (관심분야 {@code user_interests}는 엔티티 삭제 시 함께 지워진다)</li>
 * </ol>
 *
 * <p><b>모임장 위임 (PM 결정):</b> {@code groups.owner_id} 구조 유지. 같은 그룹 멤버 중 탈퇴자 본인 행을
 * 제외하고 {@code joined_at} 오름차순(같으면 {@code id} 오름차순) 첫 번째에게 넘긴다. 남은 멤버가 없으면
 * 그룹을 삭제한다. 그룹 삭제 시 다른 사람 공유 기록의 GROUP 대상 행은 기존 {@code GroupService.delete}와
 * 동일하게 건드리지 않는다.
 *
 * <p><b>스토리지 오브젝트</b>는 이 트랜잭션에서 지우지 않는다. key만 모아 {@link AccountDeletedEvent}로
 * 넘기고, 커밋 후 {@code BookPhotoObjectCleaner}가 best-effort로 지운다.
 *
 * <p>DB 쪽은 bulk JPQL을 쓰고 마지막에 명시적으로 flush한다 — FK 위반 같은 SQL 오류가 커밋 시점이 아니라
 * 이 메서드 안에서 드러나게 하고, 감사 로그·이벤트가 SQL 성공 뒤에만 남도록 하기 위해서다.
 */
@Service
@RequiredArgsConstructor
public class AccountDeletionService {

    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final BookNoteRepository bookNoteRepository;
    private final BookPhotoRepository bookPhotoRepository;
    private final ShareRecordRepository shareRecordRepository;
    private final ShareRecordTargetRepository shareRecordTargetRepository;
    private final ShareRecordPhotoRepository shareRecordPhotoRepository;
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final AuditLogger auditLogger;

    /** 호출자의 트랜잭션 안에서만 실행된다 — 부분 삭제 상태로 커밋되는 일을 구조적으로 막는다. */
    @Transactional(propagation = Propagation.MANDATORY)
    public void deleteAccount(User user) {
        Long userId = user.getId();
        List<Long> bookIds = bookRepository.findIdsByUserId(userId);

        deleteShareRecords(userId, bookIds);
        shareRecordTargetRepository.deleteAllByTarget(ShareTargetType.USER, userId);

        List<String> photoObjectKeys = List.of();
        if (!bookIds.isEmpty()) {
            photoObjectKeys = collectPhotoObjectKeys(bookIds);
            bookPhotoRepository.deleteAllByBookIds(bookIds);
            bookNoteRepository.deleteAllByBookIds(bookIds);
        }
        bookRepository.deleteAllOwnedBy(userId);

        List<GroupAudit> groupAudits = new ArrayList<>();
        List<Group> groupsToDelete = transferOrCollectOwnedGroups(userId, groupAudits);
        // flushAutomatically: 위에서 바꾼 owner_id UPDATE가 이 DELETE보다 먼저 나간다.
        groupMemberRepository.deleteAllByUserId(userId);
        groupRepository.deleteAll(groupsToDelete);

        userRepository.delete(user);
        userRepository.flush();

        groupAudits.forEach(audit -> auditLogger.event(audit.action(), userId, audit.detail()));
        auditLogger.event("ACCOUNT_DATA_DELETED", userId,
                "books=" + bookIds.size() + ", photoObjects=" + photoObjectKeys.size());
        eventPublisher.publishEvent(new AccountDeletedEvent(userId, photoObjectKeys));
    }

    private void deleteShareRecords(Long userId, List<Long> bookIds) {
        Set<Long> shareRecordIds = new LinkedHashSet<>(shareRecordRepository.findIdsByUserId(userId));
        if (!bookIds.isEmpty()) {
            shareRecordIds.addAll(shareRecordRepository.findIdsByBookIds(bookIds));
        }
        if (shareRecordIds.isEmpty()) {
            return;
        }
        shareRecordPhotoRepository.deleteAllByShareRecordIds(shareRecordIds);
        shareRecordTargetRepository.deleteAllByShareRecordIds(shareRecordIds);
        shareRecordRepository.deleteAllByIds(shareRecordIds);
    }

    private List<String> collectPhotoObjectKeys(List<Long> bookIds) {
        return bookPhotoRepository.findByBookIdIn(bookIds).stream()
                .map(photo -> BookPhotoObjectKeys.fromImageUrl(photo.getBook().getId(), photo.getImageUrl()))
                .flatMap(Optional::stream)
                .toList();
    }

    /**
     * 탈퇴자가 모임장인 그룹마다 후임자에게 위임하고, 후임자가 없는 그룹은 삭제 대상으로 돌려준다.
     * 감사 로그는 SQL이 성공한 뒤에 남기도록 {@code audits}에 모아 둔다.
     */
    private List<Group> transferOrCollectOwnedGroups(Long userId, List<GroupAudit> audits) {
        List<Group> groupsToDelete = new ArrayList<>();
        for (Group group : groupRepository.findByOwnerId(userId)) {
            Optional<GroupMember> successor = groupMemberRepository.findByGroupIdOrderByJoinedAtAscIdAsc(group.getId())
                    .stream()
                    .filter(member -> !member.getUser().getId().equals(userId))
                    .findFirst();
            if (successor.isPresent()) {
                User newOwner = successor.get().getUser();
                group.transferOwnership(newOwner);
                audits.add(new GroupAudit("GROUP_OWNER_TRANSFERRED", "groupId=" + group.getId()
                        + ", newOwnerUserId=" + newOwner.getId() + ", reason=ACCOUNT_DELETED"));
            } else {
                groupsToDelete.add(group);
                audits.add(new GroupAudit("GROUP_DELETED", "groupId=" + group.getId() + ", reason=ACCOUNT_DELETED"));
            }
        }
        return groupsToDelete;
    }

    private record GroupAudit(String action, String detail) {
    }
}
