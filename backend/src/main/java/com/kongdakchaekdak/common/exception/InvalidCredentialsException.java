package com.kongdakchaekdak.common.exception;

/**
 * 소셜 로그인(카카오/구글/네이버) 시 제공자에게 넘겨받은 토큰이 유효하지 않을 때 던지는 예외.
 * {@link GlobalExceptionHandler}에서 401 응답으로 변환된다.
 *
 * <p>과거에는 이메일/PW 로그인 실패 시에도 이 예외를 사용했으나, 이메일/PW 로그인 자체가
 * 제품 결정(2026-07-22)으로 완전히 제거되어(2026-08-27, 코드 삭제 반영) 지금은 각 OAuthClient
 * (KakaoOAuthClient/GoogleOAuthClient/NaverOAuthClient)가 토큰 검증에 실패했을 때만 던진다.</p>
 */
public class InvalidCredentialsException extends RuntimeException implements CodedException {

    private final ErrorCode errorCode;

    /**
     * @param errorCode    응답의 {@code error} 필드로 나가는 코드
     * @param debugMessage <b>로그 전용</b> 상세 메시지. 내부 PK를 담아도 되지만 응답에는 나가지 않는다.
     */
    public InvalidCredentialsException(ErrorCode errorCode, String debugMessage) {
        super(debugMessage);
        this.errorCode = errorCode;
    }

    @Override
    public ErrorCode getErrorCode() {
        return errorCode;
    }
}
