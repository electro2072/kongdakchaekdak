package com.kongdakchaekdak.domain.share;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * 테이블정의서 ShareRecord.scope: 'all'(전체공개) / 'group'(그룹) / 'custom'(인원지정).
 *
 * <p>(2026-08-28 수정, FINDING-20260827-04) {@link ShareType}과 같은 이유로 JSON도 소문자
 * exact match로 통일 — {@link ShareScopeConverter} 참고.</p>
 */
public enum ShareScope {
    ALL,
    GROUP,
    CUSTOM;

    @JsonValue
    public String toJson() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static ShareScope fromJson(String value) {
        for (ShareScope scope : values()) {
            if (scope.name().toLowerCase().equals(value)) {
                return scope;
            }
        }
        throw new IllegalArgumentException("알 수 없는 scope: " + value);
    }
}
