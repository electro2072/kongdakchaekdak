package com.bookflex.domain.share;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * 테이블정의서 ShareRecordTarget.target_type: 'user'(개인) / 'group'(그룹).
 *
 * <p>(2026-08-28 수정, FINDING-20260827-04) {@link ShareType}과 같은 이유로 JSON도 소문자
 * exact match로 통일 — {@link ShareTargetTypeConverter} 참고.</p>
 */
public enum ShareTargetType {
    USER,
    GROUP;

    @JsonValue
    public String toJson() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static ShareTargetType fromJson(String value) {
        for (ShareTargetType type : values()) {
            if (type.name().toLowerCase().equals(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("알 수 없는 targetType: " + value);
    }
}
