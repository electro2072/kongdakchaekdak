package com.kongdakchaekdak.domain.common;

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
 * <p>{@code User.interests}(다중선택, {@code Set<Genre>})와 {@code Book.genre}(단일선택)
 * 양쪽 모두 같은 날 후속 라운드에서 실제 적용을 마쳤다({@code domain/user/dto},
 * {@code domain/book/dto}를 이 세션 도구가 처음엔 폴더 깊이 제한으로 못 읽어 한 라운드
 * 미뤘던 것 — 이후 사용자가 더 깊은 폴더를 추가로 연결해줘서 해결됨, 개발현황.md 27~29번
 * 항목 참고).</p>
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

    /** 알 수 없거나 null/공백이면 빈 Optional — 자유 입력값(예: 마이그레이션 전 Book.genre)을 검증할 때 사용. */
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
