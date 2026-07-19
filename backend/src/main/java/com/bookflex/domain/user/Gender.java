package com.bookflex.domain.user;

/**
 * 사용자 성별. 선택하지 않으면 {@link #NONE}이 기본값.
 * (책 추천 등에 참고용으로 활용 예정 — 테이블정의서 User.gender 참고)
 */
public enum Gender {
    MALE,
    FEMALE,
    NONE
}
