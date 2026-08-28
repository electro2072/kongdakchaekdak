package com.kongdakchaekdak.domain.share;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * 테이블정의서 ShareRecord.share_type: 'book'(독서기록 공유) / 'dashboard'(대시보드 공유).
 *
 * <p><b>(2026-08-28 수정, FINDING-20260827-04)</b> JSON 직렬화/역직렬화도
 * {@link ShareTypeConverter}(DB 컬럼)와 동일하게 소문자로 통일한다. 이전엔 {@code @JsonValue}가
 * 없어 Jackson 기본 동작(enum 이름 그대로, 대문자)으로 직렬화됐는데, 프론트 타입
 * (`frontend/src/types/share.ts`의 `ShareType = 'book'|'dashboard'`)과 개발현황.md §13은 전부
 * 소문자를 전제로 하고 있어 프론트가 문서대로 호출하면 항상 400이 났다. {@link com.kongdakchaekdak.domain.common.Genre}와
 * 동일한 패턴(소문자 전용, exact match — 대문자를 보내면 이제 반대로 400)으로 맞춘다.</p>
 */
public enum ShareType {
    BOOK,
    DASHBOARD;

    @JsonValue
    public String toJson() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static ShareType fromJson(String value) {
        for (ShareType type : values()) {
            if (type.name().toLowerCase().equals(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("알 수 없는 shareType: " + value);
    }
}
