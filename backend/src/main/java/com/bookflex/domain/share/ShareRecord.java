package com.bookflex.domain.share;

import com.bookflex.domain.book.Book;
import com.bookflex.domain.user.User;
import jakarta.persistence.Column;
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
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * 테이블정의서 ShareRecord 매핑. 단, 테이블정의서에는 "누가 공유했는지"를 나타내는 컬럼이
 * 없다 — book_id로 book.user를 타면 되는 것처럼 보이지만, share_type=dashboard일 때는
 * book_id 자체가 NULL이라 그 방법으로는 알 수 없다. 그래서 테이블정의서에 없는 user(공유한
 * 사용자) 컬럼을 추가했다 (Step 3의 User.password_hash와 동일한 판단 방식 — "마이페이지
 * 공유 이력"을 본인 것만 보여주려면, 그리고 삭제 권한 체크를 하려면 반드시 필요함).
 * 원본 `독서기록앱_테이블정의서.xlsx`에도 이 컬럼 추가를 반영해야 한다 (TODO).
 */
@Entity
@Table(name = "share_records")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class ShareRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 테이블정의서에는 없는 컬럼 (클래스 Javadoc 참고) — 공유를 실행한 사용자.
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // share_type=dashboard일 때는 NULL (테이블정의서 그대로).
    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "book_id")
    private Book book;

    @Column(name = "share_type", nullable = false, length = 20)
    private ShareType shareType;

    @Column(nullable = false, length = 10)
    private ShareScope scope;

    @Column(nullable = false, length = 20)
    private SharePlatform platform;

    @Column(name = "card_image_url", length = 255)
    private String cardImageUrl;

    @Column(name = "public_token", length = 64)
    private String publicToken;

    @CreatedDate
    @Column(name = "shared_at", updatable = false)
    private LocalDateTime sharedAt;

    public ShareRecord(User user, Book book, ShareType shareType, ShareScope scope,
                        SharePlatform platform, String cardImageUrl, String publicToken) {
        this.user = user;
        this.book = book;
        this.shareType = shareType;
        this.scope = scope;
        this.platform = platform;
        this.cardImageUrl = cardImageUrl;
        this.publicToken = publicToken;
    }
}
