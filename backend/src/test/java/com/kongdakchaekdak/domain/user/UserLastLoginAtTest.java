package com.kongdakchaekdak.domain.user;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * "한 달 이상 미접속 사용자 인앱 알림" 설계
 * ({@code claude/독서기록앱_백엔드_비활성사용자_알림_설계_v1.md})의 {@link User#lastLoginAt}
 * 관련 순수 단위 테스트. DB/Spring 컨텍스트 없이 엔티티 로직만 검증한다 — 시간 기반 어설션을
 * 통합 테스트(요청→응답 왕복)에 넣으면 타이밍에 따라 불안정해지기 쉬워서, 여기서 엔티티
 * 레벨로 확실히 고정해둔다.
 */
class UserLastLoginAtTest {

    @Test
    void forSocialLogin으로_생성하면_lastLoginAt이_가입_시점으로_세팅된다() {
        LocalDateTime before = LocalDateTime.now();

        User user = User.forSocialLogin("테스터", "kakao", "12345");

        LocalDateTime after = LocalDateTime.now();
        assertThat(user.getLastLoginAt()).isNotNull();
        assertThat(user.getLastLoginAt()).isBetween(before, after);
    }

    @Test
    void updateLastLoginAt으로_값을_갱신할_수_있다() {
        User user = User.forSocialLogin("테스터", "kakao", "12345");
        LocalDateTime newLoginTime = LocalDateTime.now().plusDays(1);

        user.updateLastLoginAt(newLoginTime);

        assertThat(user.getLastLoginAt()).isEqualTo(newLoginTime);
    }

    @Test
    void 이_기능_배포_이전에_생성된_회원은_lastLoginAt이_null일_수_있다() {
        // JPA용 protected 기본 생성자 — 이 기능이 배포되기 전 DB에 이미 있던 행을 흉내낸다.
        // (ddl-auto: update로 컬럼만 추가되고 기존 행의 값은 NULL로 남는 상황.)
        User legacyUser = new User();

        assertThat(legacyUser.getLastLoginAt()).isNull();
    }
}
