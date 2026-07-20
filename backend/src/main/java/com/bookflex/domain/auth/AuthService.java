package com.bookflex.domain.auth;

import com.bookflex.common.exception.DuplicateResourceException;
import com.bookflex.common.exception.InvalidCredentialsException;
import com.bookflex.common.exception.ResourceNotFoundException;
import com.bookflex.domain.auth.dto.LoginRequest;
import com.bookflex.domain.auth.dto.SignupRequest;
import com.bookflex.domain.auth.dto.TokenResponse;
import com.bookflex.domain.user.RandomNicknameGenerator;
import com.bookflex.domain.user.User;
import com.bookflex.domain.user.UserRepository;
import com.bookflex.domain.user.dto.UserResponse;
import com.bookflex.security.JwtProperties;
import com.bookflex.security.JwtProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 이메일/PW 인증 (Step 3 첫 단계). socialProvider="local", socialId=이메일 로 저장해
 * 기존 User 테이블 구조를 그대로 재사용한다 (User.java 상단 Javadoc 참고).
 * 카카오/구글/네이버 소셜 로그인은 {@link SocialAuthService}에서 별도로 처리한다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private static final String LOCAL_PROVIDER = "local";

    // 가입되지 않은 이메일로 로그인 시도할 때도 bcrypt 연산 시간을 동일하게 맞춰
    // 응답 시간 차이로 "가입된 이메일인지"를 추측(enumeration)하지 못하게 하기 위한 더미 해시.
    // "dummy-password-for-timing-safety-placeholder" 문자열의 bcrypt 해시이며 실제로 매칭될 일은 없다.
    private static final String DUMMY_PASSWORD_HASH =
            "$2b$10$B0iG8VWxN3hku1xn06rUMOb4iXnP/WL/rN6ThFgsTVvpTcp8KLOMC";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final JwtProperties jwtProperties;
    private final RandomNicknameGenerator randomNicknameGenerator;

    @Transactional
    public TokenResponse signup(SignupRequest request) {
        userRepository.findBySocialProviderAndSocialId(LOCAL_PROVIDER, request.email())
                .ifPresent(u -> {
                    throw new DuplicateResourceException("이미 가입된 이메일입니다. email=" + request.email());
                });

        String nickname = (request.nickname() == null || request.nickname().isBlank())
                ? randomNicknameGenerator.generate()
                : request.nickname();

        User user = User.forLocalSignup(nickname, request.email(), passwordEncoder.encode(request.password()));

        User saved;
        try {
            // 위의 findBySocialProviderAndSocialId 체크 이후에도 동시에 같은 이메일로 가입 요청이 들어오는
            // 경쟁 상태(TOCTOU)가 있을 수 있어, User 테이블의 (social_provider, social_id) unique 제약을
            // 최후 방어선으로 둔다.
            saved = userRepository.save(user);
        } catch (DataIntegrityViolationException e) {
            throw new DuplicateResourceException("이미 가입된 이메일입니다. email=" + request.email());
        }

        return issueToken(saved.getId());
    }

    public TokenResponse login(LoginRequest request) {
        User user = userRepository.findBySocialProviderAndSocialId(LOCAL_PROVIDER, request.email())
                .orElse(null);

        String hashToVerify = (user != null && user.getPasswordHash() != null)
                ? user.getPasswordHash()
                : DUMMY_PASSWORD_HASH;
        boolean passwordMatches = passwordEncoder.matches(request.password(), hashToVerify);

        if (user == null || user.getPasswordHash() == null || !passwordMatches) {
            throw new InvalidCredentialsException("이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        return issueToken(user.getId());
    }

    public UserResponse me(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다. id=" + userId));
        return UserResponse.from(user);
    }

    TokenResponse issueToken(Long userId) {
        return TokenResponse.of(jwtProvider.generateToken(userId), jwtProperties.expirationSeconds());
    }
}
