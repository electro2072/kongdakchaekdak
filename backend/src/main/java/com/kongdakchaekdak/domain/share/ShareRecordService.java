package com.kongdakchaekdak.domain.share;

import com.kongdakchaekdak.common.exception.ForbiddenException;
import com.kongdakchaekdak.common.exception.InvalidRequestException;
import com.kongdakchaekdak.common.exception.ResourceNotFoundException;
import com.kongdakchaekdak.common.logging.AuditLogger;
import com.kongdakchaekdak.domain.book.Book;
import com.kongdakchaekdak.domain.book.BookRepository;
import com.kongdakchaekdak.domain.bookphoto.BookPhoto;
import com.kongdakchaekdak.domain.bookphoto.BookPhotoRepository;
import com.kongdakchaekdak.domain.booknote.BookNote;
import com.kongdakchaekdak.domain.booknote.BookNoteRepository;
import com.kongdakchaekdak.domain.dashboard.DashboardPeriod;
import com.kongdakchaekdak.domain.dashboard.DashboardService;
import com.kongdakchaekdak.domain.dashboard.dto.DashboardResponse;
import com.kongdakchaekdak.domain.group.Group;
import com.kongdakchaekdak.domain.group.GroupMemberRepository;
import com.kongdakchaekdak.domain.group.GroupRepository;
import com.kongdakchaekdak.domain.share.dto.DashboardSnapshotResponse;
import com.kongdakchaekdak.domain.share.dto.ShareRecordCreateRequest;
import com.kongdakchaekdak.domain.share.dto.ShareRecordNoteResponse;
import com.kongdakchaekdak.domain.share.dto.ShareRecordPhotoResponse;
import com.kongdakchaekdak.domain.share.dto.ShareRecordResponse;
import com.kongdakchaekdak.domain.share.dto.ShareTargetRequest;
import com.kongdakchaekdak.domain.share.dto.ShareTargetResponse;
import com.kongdakchaekdak.domain.user.User;
import com.kongdakchaekdak.domain.user.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * "공유했다"는 기록을 남기는 용도로 우선 구현 (사용자 결정 — scope에 따른 실제 열람 권한
 * 제어는 다음 단계로 미룸). 그래서 Book/BookNote 조회 API는 이 기능과 무관하게 계속 전체
 * 공개 상태를 유지한다. 목록 조회(list)는 다른 도메인과 달리 "본인이 공유한 기록"만
 * 보여준다 — 마이페이지 개인 이력이지 공개 자원이 아니기 때문.
 *
 * <p>Step 5-2: 카드/공개 웹페이지에 노출할 소감(bookNoteId)·사진(photoIds) 선택, 그리고
 * shareType=DASHBOARD일 때 공유 시점 대시보드 통계 스냅샷 생성이 추가됨.</p>
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShareRecordService {

    // 공유 시 한 번에 선택할 수 있는 사진 최대 장수 — 남용(무제한 첨부) 방지.
    private static final int MAX_PHOTOS = 10;

    private final ShareRecordRepository shareRecordRepository;
    private final ShareRecordTargetRepository shareRecordTargetRepository;
    private final ShareRecordPhotoRepository shareRecordPhotoRepository;
    private final BookRepository bookRepository;
    private final BookNoteRepository bookNoteRepository;
    private final BookPhotoRepository bookPhotoRepository;
    private final UserRepository userRepository;
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final DashboardService dashboardService;
    private final ObjectMapper objectMapper;
    private final AuditLogger auditLogger;

    @Transactional
    public ShareRecordResponse create(ShareRecordCreateRequest request, Long currentUserId) {
        User sharer = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다. id=" + currentUserId));

        Book book = resolveBook(request, currentUserId);
        List<ShareTargetRequest> targetRequests = resolveTargets(request);
        BookNote bookNote = resolveBookNote(request, book);
        List<BookPhoto> photos = resolvePhotos(request, book);
        String dashboardSnapshot = resolveDashboardSnapshot(request, currentUserId);

        ShareRecord record = new ShareRecord(sharer, book, request.shareType(), request.scope(),
                request.platform(), request.cardImageUrl(), UUID.randomUUID().toString(),
                bookNote, dashboardSnapshot);
        record = shareRecordRepository.save(record);

        for (ShareTargetRequest targetRequest : targetRequests) {
            validateTarget(targetRequest, currentUserId);
            shareRecordTargetRepository.save(
                    new ShareRecordTarget(record, targetRequest.targetType(), targetRequest.targetId()));
        }

        for (int i = 0; i < photos.size(); i++) {
            shareRecordPhotoRepository.save(new ShareRecordPhoto(record, photos.get(i), i));
        }

        auditLogger.event("SHARE_CREATED", currentUserId,
                "shareRecordId=" + record.getId() + ", shareType=" + request.shareType() + ", scope=" + request.scope());
        return toResponse(record);
    }

    public List<ShareRecordResponse> listMine(Long currentUserId) {
        return shareRecordRepository.findByUserIdOrderBySharedAtDesc(currentUserId).stream()
                .map(this::toResponse)
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
        shareRecordPhotoRepository.deleteByShareRecordId(id);
        shareRecordRepository.delete(record);
        auditLogger.event("SHARE_DELETED", currentUserId, "shareRecordId=" + id);
    }

    private ShareRecordResponse toResponse(ShareRecord record) {
        List<ShareTargetResponse> targets = shareRecordTargetRepository.findByShareRecordId(record.getId())
                .stream().map(ShareTargetResponse::from).toList();
        List<ShareRecordPhotoResponse> photoResponses = shareRecordPhotoRepository
                .findByShareRecordIdOrderByDisplayOrderAsc(record.getId())
                .stream().map(ShareRecordPhotoResponse::from).toList();
        ShareRecordNoteResponse noteResponse = record.getBookNote() == null
                ? null : ShareRecordNoteResponse.from(record.getBookNote());
        DashboardSnapshotResponse snapshotResponse = parseSnapshot(record.getDashboardSnapshot());
        return ShareRecordResponse.from(record, targets, noteResponse, photoResponses, snapshotResponse);
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

    // Step 5-2: bookNoteId는 shareType=BOOK일 때만 허용, 지정한 책(bookId) 소속 소감이어야 함.
    private BookNote resolveBookNote(ShareRecordCreateRequest request, Book book) {
        if (request.bookNoteId() == null) {
            return null;
        }
        if (request.shareType() != ShareType.BOOK) {
            throw new InvalidRequestException("bookNoteId는 shareType이 BOOK일 때만 지정할 수 있습니다.");
        }
        BookNote note = bookNoteRepository.findById(request.bookNoteId())
                .orElseThrow(() -> new ResourceNotFoundException("소감을 찾을 수 없습니다. id=" + request.bookNoteId()));
        if (!note.getBook().getId().equals(book.getId())) {
            throw new InvalidRequestException("bookNoteId는 공유하는 책(bookId) 소속 소감이어야 합니다.");
        }
        return note;
    }

    // Step 5-2: photoIds는 shareType=BOOK일 때만 허용, 지정한 책(bookId) 소속 사진이어야 하며
    // 최대 MAX_PHOTOS장. 요청 리스트의 순서를 그대로 display_order로 사용한다.
    private List<BookPhoto> resolvePhotos(ShareRecordCreateRequest request, Book book) {
        List<Long> photoIds = request.photoIds();
        if (photoIds == null || photoIds.isEmpty()) {
            return List.of();
        }
        if (request.shareType() != ShareType.BOOK) {
            throw new InvalidRequestException("photoIds는 shareType이 BOOK일 때만 지정할 수 있습니다.");
        }
        if (photoIds.size() > MAX_PHOTOS) {
            throw new InvalidRequestException("사진은 한 번에 최대 " + MAX_PHOTOS + "장까지 선택할 수 있습니다.");
        }

        List<BookPhoto> photos = new ArrayList<>();
        for (Long photoId : photoIds) {
            BookPhoto photo = bookPhotoRepository.findById(photoId)
                    .orElseThrow(() -> new ResourceNotFoundException("사진을 찾을 수 없습니다. id=" + photoId));
            if (!photo.getBook().getId().equals(book.getId())) {
                throw new InvalidRequestException("photoIds는 공유하는 책(bookId) 소속 사진이어야 합니다. id=" + photoId);
            }
            photos.add(photo);
        }
        return photos;
    }

    // Step 5-2: shareType=DASHBOARD일 때만 스냅샷을 만든다. 다른 교차검증들과 일관되게, 반대로
    // shareType=BOOK인데 dashboardPeriod/dashboardDate가 있으면 그냥 무시하지 않고 400으로 거부한다.
    private String resolveDashboardSnapshot(ShareRecordCreateRequest request, Long currentUserId) {
        if (request.shareType() != ShareType.DASHBOARD) {
            if (request.dashboardPeriod() != null || request.dashboardDate() != null) {
                throw new InvalidRequestException(
                        "dashboardPeriod/dashboardDate는 shareType이 DASHBOARD일 때만 지정할 수 있습니다.");
            }
            return null;
        }

        DashboardPeriod period = request.dashboardPeriod() == null ? DashboardPeriod.MONTH : request.dashboardPeriod();
        YearMonth referenceMonth;
        try {
            referenceMonth = request.dashboardDate() == null ? YearMonth.now() : YearMonth.parse(request.dashboardDate());
        } catch (DateTimeParseException ex) {
            throw new InvalidRequestException("dashboardDate는 yyyy-MM 형식이어야 합니다. 입력값=" + request.dashboardDate());
        }

        DashboardResponse dashboard = dashboardService.getDashboard(currentUserId, period, referenceMonth);
        DashboardSnapshotResponse snapshot = new DashboardSnapshotResponse(
                dashboard.periodLabel(),
                dashboard.completedBookCount(),
                dashboard.totalPagesRead(),
                dashboard.highlights() == null ? null : dashboard.highlights().topGenre(),
                dashboard.recommendedCaption()
        );
        try {
            return objectMapper.writeValueAsString(snapshot);
        } catch (JsonProcessingException e) {
            // 고정된 필드만 가진 record 직렬화라 실무적으로 발생하지 않는다 — 방어적으로만 감싼다.
            throw new IllegalStateException("대시보드 스냅샷 직렬화에 실패했습니다.", e);
        }
    }

    private DashboardSnapshotResponse parseSnapshot(String json) {
        if (json == null) {
            return null;
        }
        try {
            return objectMapper.readValue(json, DashboardSnapshotResponse.class);
        } catch (JsonProcessingException e) {
            // 저장 시점에 이 서비스가 직접 만든 JSON이라 정상적으로는 발생하지 않는다.
            throw new IllegalStateException("대시보드 스냅샷 역직렬화에 실패했습니다.", e);
        }
    }
}
