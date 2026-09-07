package com.kongdakchaekdak.domain.user;

import com.kongdakchaekdak.domain.user.dto.UserResponse;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * {@link UserResponse#from}의 {@code daysSinceLastLogin} 계산 로직 단위 테스트
 * ({@code claude/독서기록앱_백엔드_비활성사용자_알림_설계_v1.md} 6번 테스트 계획 반영).
 * MockMvc 통합 테스트로도 커버할 수 있지만, "정확히 30일"처럼 경계값을 다루려면 실제 시각과의
 * 오차가 생길 수 있어(테스트 실행 시각 vs 로그인 시각) 엔티티→DTO 변환 로직만 떼어내 직접
 * 검증한다.
 */
class UserResponseTest {

    @Test
    void lastLoginAt이_null이면_daysSinceLastLogin도_null이다() {
        // 이 기능 배포 이전 가입자로, 아직 재로그인을 한 번도 안 한 경우를 흉내낸다.
        User legacyUser = new User();

        UserResponse response = UserResponse.from(legacyUser);

        assertThat(response.lastLoginAt()).isNull();
        assertThat(response.daysSinceLastLogin()).isNull();
    }

    @Test
    void lastLoginAt이_30일_전이면_daysSinceLastLogin은_30이다() {
        User user = User.forSocialLogin("테스터", "kakao", "12345");
        user.updateLastLoginAt(LocalDateTime.now().minusDays(30));

        UserResponse response = UserResponse.from(user);

        assertThat(response.daysSinceLastLogin()).isEqualTo(30L);
    }

    @Test
    void 방금_로그인했으면_daysSinceLastLogin은_0이다() {
        User user = User.forSocialLogin("테스터", "kakao", "12345");

        UserResponse response = UserResponse.from(user);

        assertThat(response.daysSinceLastLogin()).isEqualTo(0L);
    }
}
