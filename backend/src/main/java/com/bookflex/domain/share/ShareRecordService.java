package com.bookflex.domain.share;

import com.bookflex.common.exception.ForbiddenException;
import com.bookflex.common.exception.InvalidRequestException;
import com.bookflex.common.exception.ResourceNotFoundException;
import com.bookflex.domain.book.Book;
import com.bookflex.domain.book.BookRepository;
import com.bookflex.domain.group.Group;
import com.bookflex.domain.group.GroupMemberRepository;
import com.bookflex.domain.group.GroupRepository;
import com.bookflex.domain.share.dto.ShareRecordCreateRequest;
import com.bookflex.domain.share.dto.ShareRecordResponse;
import com.bookflex.domain.share.dto.ShareTargetRequest;
import com.bookflex.domain.share.dto.ShareTargetResponse;
import com.bookflex.domain.user.User;
import com.bookflex.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * "공유했다"는 기록을 남기는 용도로 우선 구현 (사용자 결정 — scope에 따른 실제 열람 권한
 * 제어는 다음 단계로 미룸). 그래서 Book/BookNote 조회 API는 이 기능과 무관하게 계속 전체
 * 공개 상태를 유지한다. 목록 조회(list)는 다른 도메인과 달리 "본인이 공유한 기록"만
 * 보여준다 — 마이페이지 개인 이력이지 공개 자원이 아니기 때문.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShareRecordService {

    private final ShareRecordRepository shareRecordRepository;
    private final ShareRecordTargetRepository shareRecordTargetRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;

    @Transactional
    public ShareRecordResponse create(ShareRecordCreateRequest request, Long currentUserId) {
        User sharer = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다. id=" + currentUserId));

        Book book = resolveBook(request, currentUserId);
        List<ShareTargetRequest> targetRequests = resolveTargets(request);

        ShareRecord record = new ShareRecord(sharer, book, request.shareType(), request.scope(),
                request.platform(), request.cardImageUrl(), UUID.randomUUID().toString());
        record = shareRecordRepository.save(record);

        for (ShareTargetRequest targetRequest : targetRequests) {
            validateTarget(targetRequest, currentUserId);
            shareRecordTargetRepository.save(
                    new ShareRecordTarget(record, targetRequest.targetType(), targetRequest.targetId()));
        }

        List<ShareTargetResponse> targetResponses = targetRequests.stream()
                .map(t -> new ShareTargetResponse(t.targetType(), t.targetId()))
                .toList();
        return ShareRecordResponse.from(record, targetResponses);
    }

    public List<ShareRecordResponse> listMine(Long currentUserId) {
        return shareRecordRepository.findByUserIdOrderBySharedAtDesc(currentUserId).stream()
                .map(record -> {
                    List<ShareTargetResponse> targets = shareRecordTargetRepository.findByShareRecordId(record.getId())
                            .stream().map(ShareTargetResponse::from).toList();
                    return ShareRecordResponse.from(record, targets);
                })
                .toList();
    }

    @Transactional
    public void delete(Long id, Long currentUserId) {
        ShareRecord record = shareRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("공유 기록을 찾을 수 없습니다. id=" + id));

        if (!record.getUser().getId().equals(currentUserId)) {
            throw new ForbiddenException("본인이 공유한 기록만 삭제할 수 있습니다.");
        }

        shareRecordTargetRepository.deleteByShareRecordId(id);
        shareRecordRepository.delete(record);
    }

    // shareType=BOOK이면 bookId 필수 + 본인 소유 책인지 확인. shareType=DASHBOARD면 bookId는 무시(null).
    private Book resolveBook(ShareRecordCreateRequest request, Long currentUserId) {
        if (request.shareType() != ShareType.BOOK) {
            return null;
        }
        if (request.bookId() == null) {
            throw new InvalidRequestException("shareType이 BOOK이면 bookId가 필수입니다.");
        }
        Book book = bookRepository.findById(request.bookId())
                .orElseThrow(() -> new ResourceNotFoundException("책 기록을 찾을 수 없습니다. id=" + request.bookId()));
        if (!book.getUser().getId().equals(currentUserId)) {
            throw new ForbiddenException("본인 소유 책만 공유할 수 있습니다.");
        }
        return book;
    }

    // scope=ALL이면 targets는 무시(빈 목록). scope=GROUP이면 targets 필수 + 전부 GROUP 타입이어야 함.
    // scope=CUSTOM이면 targets 필수, USER/GROUP 혼합 가능.
    private List<ShareTargetRequest> resolveTargets(ShareRecordCreateRequest request) {
        if (request.scope() == ShareScope.ALL) {
            return List.of();
        }

        List<ShareTargetRequest> targets = request.targets();
        if (targets == null || targets.isEmpty()) {
            throw new InvalidRequestException("scope가 " + request.scope() + "이면 targets가 최소 1개 필요합니다.");
        }
        if (request.scope() == ShareScope.GROUP) {
            boolean allGroup = targets.stream().allMatch(t -> t.targetType() == ShareTargetType.GROUP);
            if (!allGroup) {
                throw new InvalidRequestException("scope가 GROUP이면 targets는 전부 targetType=GROUP이어야 합니다.");
            }
        }
        return targets;
    }

    private void validateTarget(ShareTargetRequest target, Long currentUserId) {
        if (target.targetType() == ShareTargetType.USER) {
            if (!userRepository.existsById(target.targetId())) {
                throw new ResourceNotFoundException("공유 대상 사용자를 찾을 수 없습니다. id=" + target.targetId());
            }
            return;
        }

        Group group = groupRepository.findById(target.targetId())
                .orElseThrow(() -> new ResourceNotFoundException("공유 대상 그룹을 찾을 수 없습니다. id=" + target.targetId()));
        boolean isOwner = group.getOwner().getId().equals(currentUserId);
        boolean isMember = groupMemberRepository.existsByGroupIdAndUserId(group.getId(), currentUserId);
        if (!isOwner && !isMember) {
            throw new ForbiddenException("본인이 속한 그룹에만 공유할 수 있습니다. groupId=" + group.getId());
        }
    }
}
