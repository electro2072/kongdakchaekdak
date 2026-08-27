package com.bookflex.domain.common;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Optional;

/**
 * 관심분야(회원가입 Frame 01.1·프로필 편집 Frame 05.2)와 책 장르(책 등록 Frame 08.2)가
 * 공유하는 고정 카테고리 6종. 디자이너 에이전트가 {@code hifi_mockup_v1.html} 실제 마크업을
 * 확인해 답변한 내용을 그대로 반영함(2026-08-27,
 * {@code claude/독서기록앱_백엔드요청_디자인_관심분야장르확인_v1.md} 참고) — 관심분야는
 * 다중선택, 장르는 단일선택이지만 카테고리 목록·표기(가운뎃점 포함 "경제·경영")는 완전히
 * 동일하다.
 *
 * <p>DB/JSON에는 enum 이름이 아니라 한글 라벨을 그대로 저장·직렬화한다({@link GenreConverter},
 * {@link #getLabel()}) — 프론트가 화면에 쓰는 문자열과 API 값이 1:1로 같아서 별도 매핑이
 * 필요 없다.</p>
 *
 * <p>{@code User.interests}에 다중선택으로 이번에 실제 적용했다. {@code Book.genre}에도
 * 단일값으로 재사용할 예정이지만, 이번 라운드는 엔티티 계층만 먼저 구현하기로 해서
 * {@code Book.genre}는 아직 기존 자유 {@code String}을 그대로 유지한다 —
 * {@code domain/book/dto}가 이 세션 도구의 폴더 깊이 제한으로 못 읽는 상태라, 내용을 안 보고
 * 타입을 바꾸면 기존 요청/응답 DTO가 조용히 깨질 위험이 있어서다. 이 enum은 그때 그대로
 * 재사용하면 된다.</p>
 */
public enum Genre {
    NOVEL("소설"),
    ESSAY("에세이"),
    SELF_DEVELOPMENT("자기계발"),
    HUMANITIES("인문"),
    SCIENCE("과학"),
    ECONOMY_MANAGEMENT("경제·경영");

    private final String label;

    Genre(String label) {
        this.label = label;
    }

    @JsonValue
    public String getLabel() {
        return label;
    }

    /** 알 수 없는 문자열이면 예외 — DB에 저장된 값이 항상 이 6개 중 하나라고 신뢰할 때 사용. */
    @JsonCreator
    public static Genre fromLabel(String label) {
        return fromLabelOrNull(label)
                .orElseThrow(() -> new IllegalArgumentException("알 수 없는 카테고리: " + label));
    }

    /** 알 수 없거나 null/공백이면 빈 Optional — 자유 입력값(예: 기존 Book.genre)을 검증할 때 사용. */
    public static Optional<Genre> fromLabelOrNull(String label) {
        if (label == null || label.isBlank()) {
            return Optional.empty();
        }
        for (Genre genre : values()) {
            if (genre.label.equals(label)) {
                return Optional.of(genre);
            }
        }
        return Optional.empty();
    }
}
