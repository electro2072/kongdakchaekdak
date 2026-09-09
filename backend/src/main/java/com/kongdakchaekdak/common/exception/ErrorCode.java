package com.kongdakchaekdak.common.exception;

import org.springframework.http.HttpStatus;

/**
 * API 에러 응답의 {@code error} 필드로 나가는 코드 목록.
 *
 * <p><b>이 enum은 사용자 문구를 갖지 않는다.</b> 백엔드는 "무슨 일이 일어났는가"(코드)만 내려보내고,
 * "사용자에게 뭐라고 할 것인가"(문구)는 프론트가 코드를 키로 자체 매핑한다
 * (설계: {@code docs/콩닥책닥_에러코드체계_설계_v1.md} §3 원칙 3).
 *
 * <p>코드 형식은 {@code ERR001} 같은 번호가 아니라 의미 있는 문자열이다 — 기존 테스트 44곳이 이미
 * 의미 문자열을 기대하고 있고, 로그에서 {@code ERR014}는 읽을 수 없기 때문이다. 사용자에게 보여줄
 * 짧은 식별자가 필요한 경우에는 코드가 아니라 {@code RequestTraceFilter}의 traceId를 쓴다 —
 * 에러의 "종류"가 아니라 "그 요청 한 건"을 특정하므로 CS 대응에 유용하다.
 *
 * <p><b>이관 진행 중</b>: {@code FORBIDDEN}, {@code INVALID_REQUEST}, {@code INVALID_CREDENTIALS},
 * {@code DUPLICATE_RESOURCE}는 각 예외 타입의 기본 코드로만 남아 있는 구(舊) 코드다. 세부 코드로
 * 전부 이관된 뒤 제거한다 — 신규 코드에서는 사용하지 않는다.
 */
public enum ErrorCode {

    // --- 401 인증 ---
    /** 토큰 없음/만료 — 클라이언트는 토큰을 폐기하고 로그인 화면으로 리셋해야 한다. */
    UNAUTHENTICATED(HttpStatus.UNAUTHORIZED),
    /** 소셜 제공자(카카오·네이버·구글·애플) 토큰 검증 실패. 어느 제공자인지는 프론트가 이미 안다. */
    SOCIAL_AUTH_FAILED(HttpStatus.UNAUTHORIZED),
    /** @deprecated 이관용 기본 코드. {@link #SOCIAL_AUTH_FAILED}를 쓸 것. */
    @Deprecated
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED),

    // --- 403 권한 ---
    /** 본인 소유가 아닌 책·소감·사진·계정·공유기록에 대한 조작. */
    NOT_OWNER(HttpStatus.FORBIDDEN),
    /** 참여하지 않은 그룹을 대상으로 한 조작. */
    NOT_GROUP_MEMBER(HttpStatus.FORBIDDEN),
    /** 그룹장만 수행 가능한 작업을 일반 멤버가 시도. */
    GROUP_LEADER_ONLY(HttpStatus.FORBIDDEN),
    /**
     * 그룹장 본인의 탈퇴 시도. 다른 403과 달리 "할 수 없다"가 아니라 "그룹을 삭제하라"는 안내이므로
     * 별도 코드로 분리했다 — 프론트는 그룹 삭제 CTA가 있는 다이얼로그를 띄운다.
     */
    GROUP_LEADER_CANNOT_LEAVE(HttpStatus.FORBIDDEN),
    /** @deprecated 이관용 기본 코드. 세부 403 코드를 쓸 것. */
    @Deprecated
    FORBIDDEN(HttpStatus.FORBIDDEN),

    // --- 404 ---
    /** 조회 대상 리소스 없음 — 프론트는 목록을 갱신하고 이전 화면으로 돌아간다. */
    NOT_FOUND(HttpStatus.NOT_FOUND),
    /** 공유 요청 본문에 지정한 대상(사용자·그룹)이 없음 — 프론트는 대상 재선택을 유도한다. */
    SHARE_TARGET_NOT_FOUND(HttpStatus.NOT_FOUND),

    // --- 409 ---
    /** 이미 그룹에 속한 사용자를 다시 추가. */
    ALREADY_GROUP_MEMBER(HttpStatus.CONFLICT),
    /** @deprecated 이관용 기본 코드. */
    @Deprecated
    DUPLICATE_RESOURCE(HttpStatus.CONFLICT),

    // --- 400 ---
    /** Bean Validation 실패 — {@code fieldErrors}에 필드별 사유가 담긴다. */
    VALIDATION_FAILED(HttpStatus.BAD_REQUEST),
    /** 공유 사진 개수 초과. 정상 UI라면 선택 단계에서 막혀야 하므로 실제 발생 시 프론트 확인 필요. */
    PHOTO_LIMIT_EXCEEDED(HttpStatus.BAD_REQUEST),
    /**
     * shareType·scope·targets 조합 규칙 위반. 정상적인 UI 조작으로는 만들 수 없는 요청이라
     * 사실상 클라이언트 버그이며, 사용자에게 설명할 내용이 없어 프론트에서 폴백 처리한다.
     */
    INVALID_SHARE_REQUEST(HttpStatus.BAD_REQUEST),
    /** 요청 본문(JSON) 파싱 실패 — enum 라벨 오류 포함. */
    MALFORMED_REQUEST(HttpStatus.BAD_REQUEST),
    /** @deprecated 이관용 기본 코드. {@link #INVALID_SHARE_REQUEST} 등 세부 코드를 쓸 것. */
    @Deprecated
    INVALID_REQUEST(HttpStatus.BAD_REQUEST),

    // --- 503 / 500 ---
    /** 이미지 업로드(presigned URL) 설정 문제로 기능 사용 불가. */
    IMAGE_STORAGE_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE),
    /** 백엔드가 분류하지 못한 예외. 이 코드일 때만 응답 {@code message}에 traceId가 실린다. */
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR);

    private final HttpStatus status;

    ErrorCode(HttpStatus status) {
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public int getStatusValue() {
        return status.value();
    }
}
