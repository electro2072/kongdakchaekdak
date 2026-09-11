package com.kongdakchaekdak.domain.group;

import com.kongdakchaekdak.domain.user.User;
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
 * 테이블정의서 Group 매핑 (공유 대상을 묶는 그룹, 예: 독서모임/가족). updated_at 컬럼이
 * 테이블정의서에 없어 createdAt만 감사 컬럼으로 둔다 — 그룹명 변경도 가능하지만 "수정 이력"
 * 자체를 추적할 필요는 없다고 판단.
 */
@Entity
@Table(name = "groups")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class Group {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(length = 50, nullable = false)
    private String name;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public Group(User owner, String name) {
        this.owner = owner;
        this.name = name;
    }

    public void rename(String name) {
        if (name != null && !name.isBlank()) {
            this.name = name;
        }
    }

    /**
     * (G16 회원 탈퇴, 2026-09-11) 모임장 위임. PM 결정으로 {@code groups.owner_id} 구조를 그대로 두고
     * 모임장이 탈퇴하면 다음 가입자에게 넘긴다 — 후임자 선정 규칙은
     * {@code AccountDeletionService} 참고. 일반 API로는 노출하지 않는다.
     */
    public void transferOwnership(User newOwner) {
        this.owner = newOwner;
    }
}
