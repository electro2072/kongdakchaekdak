package com.kongdakchaekdak.domain.book;

import com.kongdakchaekdak.common.time.KstClock;
import com.kongdakchaekdak.domain.common.Genre;
import com.kongdakchaekdak.domain.common.GenreConverter;
import com.kongdakchaekdak.domain.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

/** 테이블정의서 Book 매핑 (사용자가 등록한 책의 진행/완독 정보). User 도메인의 CreatedDate/LastModifiedDate 컨벤션과 통일. */
@Entity
@Table(name = "books")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(length = 200, nullable = false)
    private String title;

    @Column(length = 100, nullable = false)
    private String author;

    @Column(name = "cover_image", length = 255)
    private String coverImage;

    @Column(length = 20)
    private String isbn;

    // 2026-08-27: 자유 입력 String에서 고정 카테고리 Genre enum으로 전환(User.interests와 동일한
    // GenreConverter 패턴 — DB에는 enum 이름이 아니라 한글 라벨 그대로 저장됨). 단일선택이라
    // User.interests(ElementCollection)와 달리 그냥 컬럼 하나.
    @Convert(converter = GenreConverter.class)
    @Column(name = "genre", length = 20)
    private Genre genre;

    @Column(name = "total_pages")
    private Integer totalPages;

    @Column(nullable = false, length = 10)
    private BookStatus status = BookStatus.READING;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Book(User user, String title, String author, String coverImage, String isbn,
                Genre genre, Integer totalPages, LocalDate startDate) {
        this.user = user;
        this.title = title;
        this.author = author;
        this.coverImage = coverImage;
        this.isbn = isbn;
        this.genre = genre;
        this.totalPages = totalPages;
        // (OBS-26, 2026-09-10) 서버 JVM 기본 타임존(배포 환경에선 UTC)이 아니라 서비스 타임존
        // (KST) 기준 "오늘"로 고정한다 — KstClock 참고.
        this.startDate = startDate == null ? KstClock.today() : startDate;
        this.status = BookStatus.READING;
    }

    public void update(String title, String author, String coverImage, String isbn,
                        Genre genre, Integer totalPages) {
        if (title != null) this.title = title;
        if (author != null) this.author = author;
        if (coverImage != null) this.coverImage = coverImage;
        if (isbn != null) this.isbn = isbn;
        if (genre != null) this.genre = genre;
        if (totalPages != null) this.totalPages = totalPages;
    }

    public void complete(LocalDate endDate) {
        this.status = BookStatus.DONE;
        // (OBS-26, 2026-09-10) endDate 생략 시 "오늘"을 서버 JVM 기본 타임존이 아니라 서비스
        // 타임존(KST) 기준으로 고정한다. 이전엔 배포 환경(UTC) 기준 "오늘"을 썼는데, KST
        // 00:00~08:59 사이에 완독 처리하면 UTC로는 아직 전날이라 시작일보다 이른 완독일이
        // 잡히는 문제가 있었다(테스터 관측: "2026.09.09 ~ 2026.09.08 (0일)"). endDate <
        // startDate가 되는 입력 자체를 막는 검증은 BookService.complete()에서 한다.
        this.endDate = endDate == null ? KstClock.today() : endDate;
    }

    /**
     * 시작일~종료일을 양 끝 포함해서 센 완독 일수 (화면설계서 서재 탭의 "9일" 표기와 동일한 계산,
     * 예: 06.20~06.28 = 9일). 아직 완독 전(endDate 없음)이면 null — Step 5-2 공개 공유 웹뷰에서
     * 사용. DashboardService에도 동일한 계산 로직이 있지만(완독한 책만 다뤄 endDate가 항상 있음이
     * 보장된 상태였음), 이미 리뷰를 마친 그 코드는 그대로 두고 이 메서드가 향후 신규 호출부의
     * 단일 기준이 되도록 한다.
     */
    public Long readingDays() {
        if (endDate == null) {
            return null;
        }
        return ChronoUnit.DAYS.between(startDate, endDate) + 1;
    }
}
