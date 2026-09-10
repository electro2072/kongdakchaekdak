package com.kongdakchaekdak.domain.user.dto;

import com.kongdakchaekdak.common.time.KstClock;
import com.kongdakchaekdak.domain.common.Genre;
import com.kongdakchaekdak.domain.user.Gender;
import com.kongdakchaekdak.domain.user.User;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Set;

/**
 * 회원 조회 응답.
 *
 * <p>(2026-09-07) {@code lastLoginAt}/{@code daysSinceLastLogin} 추가 — "한 달 이상 미접속
 * 사용자에게 인앱 알림" 기능 설계({@code claude/독서기록앱_백엔드_비활성사용자_알림_설계_v1.md})
 * 반영. 배너를 띄울지 말지, 문구가 뭔지는 전부 프론트 몫이고 서버는 "마지막 로그인 후 며칠
 * 지났는지"만 계산해서 내려준다. {@code lastLoginAt}이 {@code null}인 경우(이 기능 배포 이전
 * 가입자로, 이 기능이 배포된 뒤 아직 한 번도 재로그인하지 않은 경우)는 {@code daysSinceLastLogin}도
 * {@code null}로 내려간다 — 프론트는 이 값을 0/음수가 아니라 "판단 불가"로 취급해서 배너를
 * 띄우지 않는 것으로 계약한다.</p>
 *
 * <p><b>주의(구현 시 판단, PM 확인 필요)</b>: 이 DTO는 {@code GET /api/auth/me}뿐 아니라
 * {@code GET /api/users/{id}}, {@code GET /api/users} 등 "다른 회원"의 프로필을 조회하는
 * API에서도 그대로 쓰인다 — 즉 다른 사용자의 lastLoginAt/daysSinceLastLogin도 함께 노출된다.
 * 설계 문서(v1)의 범위는 "내 정보"(/me) 기준이었는데, 별도 응답 타입으로 분리하지 않고 기존
 * UserResponse에 필드를 추가하는 가장 단순한 방식을 택했다. 다른 회원에게 이 정보가 보이는 게
 * 프라이버시상 문제가 된다고 판단되면 {@code /me} 전용 응답 타입으로 분리하는 걸 후속으로
 * 검토해야 한다.</p>
 */
@Schema(description = "회원 조회 응답")
public record UserResponse(
        Long id,
        String nickname,
        String profileImage,
        String bio,
        Gender gender,
        String socialProvider,
        Set<Genre> interests,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        LocalDateTime lastLoginAt,
        Long daysSinceLastLogin
) {
    public static UserResponse from(User user) {
        // (OBS-26 확장, 2026-09-10) lastLoginAt이 User/SocialAuthService에서 이제 KST 기준으로
        // 기록되므로, 여기서도 같은 기준(KST)의 "지금"과 비교해야 한다 — 한쪽만 KST로 바꾸면
        // daysSinceLastLogin이 자정 근처에서 최대 하루 어긋나는 문제가 그대로 남는다.
        Long daysSinceLastLogin = user.getLastLoginAt() == null
                ? null
                : Duration.between(user.getLastLoginAt(), LocalDateTime.now(KstClock.ZONE)).toDays();

        return new UserResponse(
                user.getId(),
                user.getNickname(),
                user.getProfileImage(),
                user.getBio(),
                user.getGender(),
                user.getSocialProvider(),
                user.getInterests(),
                user.getCreatedAt(),
                user.getUpdatedAt(),
                user.getLastLoginAt(),
                daysSinceLastLogin
        );
    }
}
