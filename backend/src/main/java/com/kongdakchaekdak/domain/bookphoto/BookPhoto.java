package com.kongdakchaekdak.domain.bookphoto;

import com.kongdakchaekdak.domain.book.Book;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 테이블정의서 BookPhoto 매핑 (책 상세 페이지의 장소 사진). 테이블정의서에는 updated_at이 없어
 * (사진은 수정 개념이 없고 등록/삭제만 존재) createdAt만 감사 컬럼으로 둔다.
 */
@Entity
@Table(name = "book_photos")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class BookPhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @Column(name = "image_url", length = 255, nullable = false)
    private String imageUrl;

    @Column(name = "location_text", length = 100)
    private String locationText;

    @Column(precision = 9, scale = 6)
    private BigDecimal latitude;

    @Column(precision = 9, scale = 6)
    private BigDecimal longitude;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public BookPhoto(Book book, String imageUrl, String locationText, BigDecimal latitude, BigDecimal longitude) {
        this.book = book;
        this.imageUrl = imageUrl;
        this.locationText = locationText;
        this.latitude = latitude;
        this.longitude = longitude;
    }
}
