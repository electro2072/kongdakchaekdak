package com.bookflex.domain.share;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

/**
 * 테이블정의서 ShareRecordTarget 매핑. target_id는 target_type에 따라 User.id 또는 Group.id를
 * 가리키는 다형(polymorphic) 참조라, DB에 FK 제약을 걸지 않고 애플리케이션 레벨(ShareRecordService)에서
 * target_type별로 실제 존재하는 User/Group인지 검증한다 (테이블정의서에도 FK 컬럼이 없음).
 */
@Entity
@Table(name = "share_record_targets")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ShareRecordTarget {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "share_record_id", nullable = false)
    private ShareRecord shareRecord;

    @Column(name = "target_type", nullable = false, length = 10)
    private ShareTargetType targetType;

    @Column(name = "target_id", nullable = false)
    private Long targetId;

    public ShareRecordTarget(ShareRecord shareRecord, ShareTargetType targetType, Long targetId) {
        this.shareRecord = shareRecord;
        this.targetType = targetType;
        this.targetId = targetId;
    }
}
