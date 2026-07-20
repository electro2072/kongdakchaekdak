package com.bookflex.domain.share;

import com.bookflex.config.PublicWebProperties;
import com.bookflex.domain.book.Book;
import com.bookflex.domain.share.dto.DashboardSnapshotResponse;
import com.bookflex.domain.user.User;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * ShareRecord(+연관 데이터)를 읽어 비로그인 공개 웹페이지(PublicShareController)에 그대로
 * 넘길 수 있는 평탄화된 PublicShareView로 만든다. scope(all/group/custom)는 여기서 전혀
 * 확인하지 않는다 — public_token을 아는 사람은 scope와 무관하게 볼 수 있다는 정책이
 * 기획서 7-4에서 이미 확정되어 있기 때문(재확인만 하고 그대로 따름).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PublicShareViewService {

    private static final String ANONYMOUS_NICKNAME = "익명의 독서가";
    private static final int NOTE_PREVIEW_LENGTH = 100;

    private final ShareRecordRepository shareRecordRepository;
    private final ShareRecordPhotoRepository shareRecordPhotoRepository;
    private final ObjectMapper objectMapper;
    private final PublicWebProperties publicWebProperties;

    public Optional<PublicShareView> getView(String token) {
        return shareRecordRepository.findByPublicToken(token).map(record -> build(record, token));
    }

    private PublicShareView build(ShareRecord record, String token) {
        String nickname = resolveNickname(record.getUser());
        String pageUrl = publicWebProperties.baseUrl() + "/public/share/" + token;

        if (record.getShareType() == ShareType.BOOK) {
            return buildBookView(record, nickname, pageUrl);
        }
        return buildDashboardView(record, nickname, pageUrl);
    }

    private PublicShareView buildBookView(ShareRecord record, String nickname, String pageUrl) {
        Book book = record.getBook();
        List<PublicShareView.PhotoView> photos = shareRecordPhotoRepository
                .findByShareRecordIdOrderByDisplayOrderAsc(record.getId()).stream()
                .map(p -> new PublicShareView.PhotoView(p.getBookPhoto().getImageUrl(), p.getBookPhoto().getLocationText()))
                .toList();
        String noteContent = record.getBookNote() == null ? null : record.getBookNote().getContent();
        String ogImage = resolveBookOgImage(record, book, photos);

        String ogDescription = noteContent != null
                ? truncate(noteContent, NOTE_PREVIEW_LENGTH)
                : book.getAuthor() + " · " + book.getStartDate()
                        + " ~ " + (book.getEndDate() != null ? book.getEndDate().toString() : "");

        return new PublicShareView(
                ShareType.BOOK,
                nickname,
                nickname + "님의 『" + book.getTitle() + "』 독서 기록",
                ogDescription,
                ogImage,
                pageUrl,
                book.getTitle(),
                book.getAuthor(),
                book.getCoverImage(),
                book.getStartDate(),
                book.getEndDate(),
                book.readingDays(),
                noteContent,
                photos,
                null, null, null, null, null
        );
    }

    private PublicShareView buildDashboardView(ShareRecord record, String nickname, String pageUrl) {
        DashboardSnapshotResponse snapshot = parseSnapshot(record.getDashboardSnapshot());
        String periodLabel = snapshot == null ? null : snapshot.periodLabel();
        String caption = snapshot == null ? null : snapshot.recommendedCaption();
        String ogImage = record.getCardImageUrl() != null && !record.getCardImageUrl().isBlank()
                ? record.getCardImageUrl()
                : blankToNull(publicWebProperties.defaultOgImageUrl());

        return new PublicShareView(
                ShareType.DASHBOARD,
                nickname,
                nickname + "님의 " + (periodLabel == null ? "" : periodLabel + " ") + "독서 리캡",
                caption,
                ogImage,
                pageUrl,
                null, null, null, null, null, null, null, List.of(),
                periodLabel,
                snapshot == null ? null : snapshot.completedBookCount(),
                snapshot == null ? null : snapshot.totalPagesRead(),
                snapshot == null ? null : snapshot.topGenre(),
                caption
        );
    }

    private String resolveBookOgImage(ShareRecord record, Book book, List<PublicShareView.PhotoView> photos) {
        if (record.getCardImageUrl() != null && !record.getCardImageUrl().isBlank()) {
            return record.getCardImageUrl();
        }
        if (book.getCoverImage() != null && !book.getCoverImage().isBlank()) {
            return book.getCoverImage();
        }
        if (!photos.isEmpty()) {
            return photos.get(0).imageUrl();
        }
        return blankToNull(publicWebProperties.defaultOgImageUrl());
    }

    private String resolveNickname(User user) {
        return (user.getNickname() == null || user.getNickname().isBlank()) ? ANONYMOUS_NICKNAME : user.getNickname();
    }

    private String truncate(String text, int maxLength) {
        if (text.length() <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength) + "…";
    }

    private String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value;
    }

    private DashboardSnapshotResponse parseSnapshot(String json) {
        if (json == null) {
            return null;
        }
        try {
            return objectMapper.readValue(json, DashboardSnapshotResponse.class);
        } catch (JsonProcessingException e) {
            // 공개 웹뷰는 스냅샷이 깨졌다고 해서 500을 내는 대신, 그 부분만 빈 값으로 완만하게 처리한다.
            return null;
        }
    }
}
