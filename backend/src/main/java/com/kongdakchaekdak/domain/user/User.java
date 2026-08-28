package com.kongdakchaekdak.domain.user;

import com.kongdakchaekdak.domain.common.Genre;
import com.kongdakchaekdak.domain.common.GenreConverter;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
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
import java.util.LinkedHashSet;
import java.util.Set;

/**
 * 테이블정의서 User 매핑.
 *
 * <p>주의(Step 2 진행 중 판단): social_provider / social_id는 테이블정의서상 NOT NULL이지만,
 * Step 3(소셜 로그인)이 아직 구현되지 않아 지금 단계에서는 nullable로 완화했다.
 * CRUD 동작을 먼저 검증하기 위한 임시 조치이며, Step 3에서 OAuth2 연동 시 이 완화를
 * 다시 검토해야 한다.</p>
 *
 * <p>(social_provider, social_id) 조합에는 unique 제약을 걸어 동일 소셜 계정 중복 가입을
 * DB 레벨에서도 막는다.</p>
 *
 * <p>제품 결정(2026-07-22): 서버가 비밀번호 등 인증 정보를 직접 보관하지 않기로 하면서
 * 이메일/PW 로그인은 완전히 제거되었다(2026-08-27, 코드에 남아있던 것을 뒤늦게 발견해서
 * 이번에 실제로 삭제함) — 이 엔티티는 카카오/구글/네이버 소셜 로그인만 지원한다
 * ({@link #forSocialLogin}). 참고로 기존에 있던 {@code password_hash} 컬럼은 이 변경으로
 * 더 이상 애플리케이션에서 쓰이지 않지만, {@code ddl-auto: update} 특성상 DB 테이블에는
 * 그대로 남아있을 수 있다 — 필요하면 수동으로 컬럼을 정리해야 한다.</p>
 *
 * <p>관심분야(2026-08-27 추가, {@link #interests}): 회원가입(Frame 01.1)·프로필 편집
 * (Frame 05.2) 화면이 다중선택으로 입력받는 값을 저장한다. 디자이너 에이전트가
 * {@code hifi_mockup_v1.html} 실제 마크업을 확인해 회신한 고정 6개 카테고리
 * ({@link Genre})만 허용한다(자유 입력 아님) —
 * {@code claude/독서기록앱_백엔드요청_디자인_관심분야장르확인_v1.md} 참고. 같은 날 후속
 * 라운드에서 {@code UserCreateRequest}/{@code UserUpdateRequest}/{@code UserResponse} 및
 * {@code UserService.create/update}까지 실제로 연동을 마쳐, 회원가입/프로필 수정 API가 이
 * 필드를 채운다(개발현황.md 27·29번 항목 참고). {@code Book.genre}도 같은 라운드에서 동일한
 * {@link Genre}/{@link GenreConverter} 패턴으로 String에서 전환했다(단, 단일선택이라
 * ElementCollection이 아닌 단순 컬럼).</p>
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

    // 테이블정의서에는 없던 컬럼 — 관심분야 다중선택(2026-08-27 추가). 회원당 최대 6개(전체
    // 카테고리 수)이므로 별도 순서 보장은 불필요, 응답 시 일관된 순서를 위해 LinkedHashSet 사용.
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "user_interests", joinColumns = @JoinColumn(name = "user_id"))
    @Convert(converter = GenreConverter.class)
    @Column(name = "genre", length = 20)
    private Set<Genre> interests = new LinkedHashSet<>();

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
     * 소셜 로그인(카카오/구글/네이버) 최초 가입 전용 팩토리. {@code socialProvider}는
     * "kakao"/"google"/"naver", {@code socialId}는 각 제공자가 내려주는 고유 사용자 식별자
     * (카카오 id, 구글 sub, 네이버 id)를 문자열로 저장한다.
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
