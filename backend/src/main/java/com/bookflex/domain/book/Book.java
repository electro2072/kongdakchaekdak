package com.bookflex.domain.book;

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
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

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

    @Column(length = 30)
    private String genre;

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
                String genre, Integer totalPages, LocalDate startDate) {
        this.user = user;
        this.title = title;
        this.author = author;
        this.coverImage = coverImage;
        this.isbn = isbn;
        this.genre = genre;
        this.totalPages = totalPages;
        this.startDate = startDate == null ? LocalDate.now() : startDate;
        this.status = BookStatus.READING;
    }

    public void update(String title, String author, String coverImage, String isbn,
                        String genre, Integer totalPages) {
        if (title != null) this.title = title;
        if (author != null) this.author = author;
        if (coverImage != null) this.coverImage = coverImage;
        if (isbn != null) this.isbn = isbn;
        if (genre != null) this.genre = genre;
        if (totalPages != null) this.totalPages = totalPages;
    }

    public void complete(LocalDate endDate) {
        this.status = BookStatus.DONE;
        this.endDate = endDate == null ? LocalDate.now() : endDate;
    }
}
