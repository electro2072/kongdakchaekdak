package com.kongdakchaekdak.domain.auth;

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
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다. id=" + userId));
        return UserResponse.from(user);
    }

    TokenResponse issueToken(Long userId) {
        return TokenResponse.of(jwtProvider.generateToken(userId), jwtProperties.expirationSeconds());
    }
}
