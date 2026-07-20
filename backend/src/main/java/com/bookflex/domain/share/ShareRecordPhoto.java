package com.bookflex.domain.share;

import com.bookflex.domain.bookphoto.BookPhoto;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Step 5-2 설계로 신규 추가된 테이블(테이블정의서에 없음, xlsx 반영 필요) — 공유 기록에
 * 공유자가 직접 선택한 BookPhoto를 순서대로 매핑한다(N:M + 순서). shareType=BOOK인
 * ShareRecord에서만 쓰인다. {@code (shareRecord, bookPhoto)} 조합은 유니크 — 같은 사진을
 * 한 공유 기록에 중복으로 선택할 수 없다.
 */
@Entity
@Table(name = "share_record_photos",
        uniqueConstraints = @UniqueConstraint(columnNames = {"share_record_id", "book_photo_id"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ShareRecordPhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "share_record_id", nullable = false)
    private ShareRecord shareRecord;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "book_photo_id", nullable = false)
    private BookPhoto bookPhoto;

    // 노출 순서 (0부터) — 공유 요청의 photoIds 리스트 순서를 그대로 반영.
    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    public ShareRecordPhoto(ShareRecord shareRecord, BookPhoto bookPhoto, int displayOrder) {
        this.shareRecord = shareRecord;
        this.bookPhoto = bookPhoto;
        this.displayOrder = displayOrder;
    }
}
