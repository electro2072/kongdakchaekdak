package com.bookflex.domain.share;

import java.time.LocalDate;
import java.util.List;

/**
 * 비로그인 공개 공유 웹페이지(/public/share/{token})용으로 완전히 평탄화한 뷰 모델.
 * 컨트롤러/템플릿 경계에는 엔티티(지연 로딩 프록시)를 넘기지 않고, 필요한 값을 전부
 * 문자열/기본 타입으로 미리 뽑아서 담는다 — 이 프로젝트의 다른 Response 레코드들과 동일한
 * "엔티티를 서비스 밖으로 내보내지 않는다" 원칙을 뷰 렌더링에도 그대로 적용한 것.
 *
 * <p>shareType에 따라 BOOK 전용 필드 또는 DASHBOARD 전용 필드만 값이 있고 나머지는
 * null/빈 값이다.</p>
 */
public record PublicShareView(
        ShareType shareType,
        String sharerNickname,
        String ogTitle,
        String ogDescription,
        String ogImageUrl,
        String pageUrl,
        // shareType=BOOK 전용
        String bookTitle,
        String bookAuthor,
        String bookCoverImage,
        LocalDate bookStartDate,
        LocalDate bookEndDate,
        Long readingDays,
        String noteContent,
        List<PhotoView> photos,
        // shareType=DASHBOARD 전용
        String dashboardPeriodLabel,
        Long dashboardCompletedBookCount,
        Long dashboardTotalPagesRead,
        String dashboardTopGenre,
        String dashboardRecommendedCaption
) {
    public record PhotoView(String imageUrl, String locationText) {
    }
}
