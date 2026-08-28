package com.bookflex.domain.share;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * 테이블정의서 ShareRecord.platform: 'app' / 'instagram' / 'threads' / 'tiktok'.
 *
 * <p>(2026-08-28 수정, FINDING-20260827-04) {@link ShareType}과 같은 이유로 JSON도 소문자
 * exact match로 통일 — {@link SharePlatformConverter} 참고.</p>
 */
public enum SharePlatform {
    APP,
    INSTAGRAM,
    THREADS,
    TIKTOK;

    @JsonValue
    public String toJson() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static SharePlatform fromJson(String value) {
        for (SharePlatform platform : values()) {
            if (platform.name().toLowerCase().equals(value)) {
                return platform;
            }
        }
        throw new IllegalArgumentException("알 수 없는 platform: " + value);
    }
}
