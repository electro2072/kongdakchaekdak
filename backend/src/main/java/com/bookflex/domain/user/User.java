package com.bookflex.domain.user;

import com.bookflex.domain.common.Genre;
import com.bookflex.domain.common.GenreConverter;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
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
 *
 * <p>(social_provider, social_id) 조합에는 unique 제약을 걸어 이메일/PW 중복 가입 및
 * 향후 동일 소셜 계정 중복 가입을 DB 레벨에서도 막는다. NULL 값은 MySQL/H2 모두 유니크
 * 제약에서 서로 다른 값으로 취급되므로, 아직 두 컬럼이 비어 있는 기존 Step 2 테스트 데이터와는
 * 충돌하지 않는다.</p>
 * <p>관심분야(2026-08-27 추가, {@link #interests}): 회원가입(Frame 01.1)·프로필 편집
 * (Frame 05.2) 화면이 다중선택으로 입력받는 값을 저장한다. 디자이너 에이전트가
 * {@code hifi_mockup_v1.html} 실제 마크업을 확인해 회신한 고정 6개 카테고리
 * ({@link Genre})만 허용한다(자유 입력 아님) —
 * {@code claude/독서기록앱_백엔드요청_디자인_관심분야장르확인_v1.md} 참고. 이번 라운드는
 * 엔티티 계층만 먼저 구현한 것으로, 회원가입/프로필 수정 API가 실제로 이 필드를 채우도록
 * 하는 서비스·DTO 연동은 아직 없다({@code domain/user/dto}가 이 세션 도구의 폴더 깊이
 * 제한으로 못 읽는 상태라 다음 라운드로 미룸, 개발현황.md 27번 항목 참고).</p>
 */
@Entity
@Table(name = "users", uniqueConstraints = @UniqueConstraint(columnNames = {"social_provider", "social_id"}))
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

    // TODO(Step 3 이후): 실제 소셜 로그인(카카오 등) 붙이면 NOT NULL 제약 추가 검토 (unique 제약은 위에서 이미 적용됨)
    @Column(name = "social_provider", length = 20)
    private String socialProvider;

    @Column(name = "social_id", length = 100)
    private String socialId;

    /**
     * Step 3(인증) 판단 사항: 테이블정의서에는 없는 컬럼이지만, "이메일/PW로 먼저 인증 구조를
     * 검증한 뒤 카카오→구글→네이버 OAuth2 순으로 붙인다"는 백엔드구축계획 순서를 따르기 위해 추가함.
     * 이메일/PW 로그인은 socialProvider="local", socialId=이메일 로 저장하고(별도 email 컬럼을
     * 새로 만들지 않고 기존 social_id를 재사용), 이 필드에 비밀번호 해시(BCrypt)만 별도 보관한다.
     * 실제 소셜 로그인(카카오 등) 사용자는 이 필드가 계속 null.
     */
    @Column(name = "password_hash", length = 255)
    private String passwordHash;

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

    /**
     * 이메일/PW 회원가입 전용 팩토리. socialProvider="local", socialId=이메일 로 저장한다
     * (클래스 상단 Javadoc 참고). 비밀번호는 반드시 인코딩(BCrypt 등)된 값을 전달해야 한다.
     */
    public static User forLocalSignup(String nickname, String email, String encodedPassword) {
        User user = new User(nickname, null, null, null, "local", email);
        user.passwordHash = encodedPassword;
        return user;
    }

    /**
     * 소셜 로그인(카카오/구글/네이버) 최초 가입 전용 팩토리. {@code socialProvider}는
     * "kakao"/"google"/"naver", {@code socialId}는 각 제공자가 내려주는 고유 사용자 식별자
     * (카카오 id, 구글 sub, 네이버 id)를 문자열로 저장한다. passwordHash는 계속 null로 남는다.
     */
    public static User forSocialLogin(String nickname, String socialProvider, String socialId) {
        return new User(nickname, null, null, null, socialProvider, socialId);
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

    /**
     * 관심분야를 통째로 교체한다(부분 추가/삭제가 아니라 항상 전체 목록을 다시 받는 방식 —
     * 화면(Frame 05.2)도 "선택된 칩 목록"을 통째로 보여주고 저장하는 구조라 이쪽이 더 단순함).
     * {@code null}은 무시(변경 없음), 빈 Set은 "관심분야 전체 해제"로 허용한다.
     */
    public void updateInterests(Set<Genre> interests) {
        if (interests == null) {
            return;
        }
        this.interests.clear();
        this.interests.addAll(interests);
    }
}
