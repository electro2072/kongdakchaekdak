package com.kongdakchaekdak.domain.auth;

import com.kongdakchaekdak.common.exception.ErrorCode;
import com.kongdakchaekdak.common.exception.ResourceNotFoundException;
import com.kongdakchaekdak.domain.auth.dto.TokenResponse;
import com.kongdakchaekdak.domain.user.User;
import com.kongdakchaekdak.domain.user.UserRepository;
import com.kongdakchaekdak.domain.user.dto.UserResponse;
import com.kongdakchaekdak.security.JwtProperties;
import com.kongdakchaekdak.security.JwtProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 인증 공통 기능. 실제 로그인은 카카오/구글/네이버 소셜 로그인만 지원한다
 * ({@link SocialAuthService} 참고) — 서버가 비밀번호 등 인증 정보를 직접 보관하지 않는다는
 * 제품 결정(2026-07-22)에 따라 이메일/PW 회원가입/로그인은 완전히 제거되었다
 * (2026-08-27, 코드에 남아있던 것을 뒤늦게 발견해서 이번에 실제로 삭제함).
 * 이 클래스는 소셜 로그인도 함께 쓰는 토큰 발급({@link #issueToken})과 내 정보 조회만 담당한다.
 *
 * <p>{@link #issueToken}은 2026-08-29부터 {@code isNewUser} 인자를 받는다 — 프론트가
 * 로그인 응답만으로 "방금 신규 가입된 계정인지 / 기존 계정으로 로그인한 것인지"를 판별할 수
 * 있어야, 신규 회원가입 화면(추가 정보 입력)으로 보낼지 바로 메인으로 보낼지 분기할 수 있기
 * 때문 ({@code claude/독서기록앱_프론트요청_백엔드_인증API_신규회원판별_v1.md} 요청 반영).
 * 신규/기존 여부는 호출자(SocialAuthService)가 이미 알고 있으므로 여기서는 그대로 전달만 한다.</p>
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final UserRepository userRepository;
    private final JwtProvider jwtProvider;
    private final JwtProperties jwtProperties;

    public UserResponse me(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.NOT_FOUND, "사용자를 찾을 수 없습니다. id=" + userId));
        return UserResponse.from(user);
    }

    TokenResponse issueToken(Long userId, boolean isNewUser) {
        return TokenResponse.of(jwtProvider.generateToken(userId), jwtProperties.expirationSeconds(), isNewUser);
    }
}
