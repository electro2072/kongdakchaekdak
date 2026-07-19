package com.bookflex.domain.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import jakarta.persistence.EntityListeners;
import java.time.LocalDateTime;

/**
 * 테이블정의서 User 매핑.
 *
 * <p>주의(Step 2 진행 중 판단): social_provider / social_id는 테이블정의서상 NOT NULL이지만,
 * Step 3(소셜 로그인)이 아직 구현되지 않아 지금 단계에서는 nullable로 완화했다.
 * CRUD 동작을 먼저 검증하기 위한 임시 조치이며, Step 3에서 OAuth2 연동 시 이 완화를
 * 다시 검토해야 한다.</p>
 */
@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 30)
    private String nickname;

    @Column(name = "profile_image", length = 255)
    private String profileImage;

    @Column(length = 100)
    private String bio;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private Gender gender;

    // TODO(Step 3): 소셜 로그인 붙으면 NOT NULL + unique(social_provider, social_id) 제약 추가
    @Column(name = "social_provider", length = 20)
    private String socialProvider;

    @Column(name = "social_id", length = 100)
    private String socialId;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public User(String nickname, String profileImage, String bio, Gender gender,
                 String socialProvider, String socialId) {
        this.nickname = nickname;
        this.profileImage = profileImage;
        this.bio = bio;
        this.gender = gender == null ? Gender.NONE : gender;
        this.socialProvider = socialProvider;
        this.socialId = socialId;
    }

    public void updateProfile(String nickname, String profileImage, String bio, Gender gender) {
        if (nickname != null) {
            this.nickname = nickname;
        }
        if (profileImage != null) {
            this.profileImage = profileImage;
        }
        if (bio != null) {
            this.bio = bio;
        }
        if (gender != null) {
            this.gender = gender;
        }
    }
}
