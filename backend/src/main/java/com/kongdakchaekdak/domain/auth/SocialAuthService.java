package com.kongdakchaekdak.domain.auth;

import com.kongdakchaekdak.common.logging.AuditLogger;
import com.kongdakchaekdak.common.logging.SecurityEventLogger;
import com.kongdakchaekdak.domain.auth.dto.TokenResponse;
import com.kongdakchaekdak.domain.auth.oauth2.GoogleOAuthClient;
import com.kongdakchaekdak.domain.auth.oauth2.KakaoOAuthClient;
import com.kongdakchaekdak.domain.auth.oauth2.NaverOAuthClient;
import com.kongdakchaekdak.domain.auth.oauth2.SocialUserInfo;
import com.kongdakchaekdak.domain.user.RandomNicknameGenerator;
import com.kongdakchaekdak.domain.user.User;
import com.kongdakchaekdak.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * 카카오 → 구글 → 네이버 소셜 로그인 (Step 3 두 번째 단계). 모바일 앱이 각 제공자 SDK로
 * 이미 로그인해서 받은 토큰(카카오/네이버는 access token, 구글은 ID token)을 그대로 넘겨받아,
 * 각 OAuthClient로 제공자 쪽 사용자 식별자를 확인한 뒤 (socialProvider, socialId) 조합으로
 * 기존 회원을 찾거나 없으면 새로 만들고, 이메일/PW 로그인과 동일하게 우리 앱의 JWT를 발급한다.
 *
 * <p>지금은 회원가입 시점에 성별/관심분야 등 추가 정보를 받지 않고 바로 로그인시켜서
 * "최소 기능으로 인증 구조 검증"에 집중한다 — 온보딩 화면(Frame 01.1)에서 추가 정보를 받는
 * 플로우는 프론트가 준비된 뒤 별도로 붙일 것.</p>
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SocialAuthService {

    private static final String KAKAO_PROVIDER = "kakao";
    private static final String GOOGLE_PROVIDER = "google";
    private static final String NAVER_PROVIDER = "naver";

    private final UserRepository userRepository;
    private final RandomNicknameGenerator randomNicknameGenerator;
    private final AuthService authService;
    private final KakaoOAuthClient kakaoOAuthClient;
    private final GoogleOAuthClient googleOAuthClient;
    private final NaverOAuthClient naverOAuthClient;
    private final AuditLogger auditLogger;
    private final SecurityEventLogger securityEventLogger;

    @Transactional
    public TokenResponse loginWithKakao(String accessToken) {
        return loginWithProvider(KAKAO_PROVIDER, kakaoOAuthClient.fetchUserInfo(accessToken));
    }

    @Transactional
    public TokenResponse loginWithGoogle(String idToken) {
        return loginWithProvider(GOOGLE_PROVIDER, googleOAuthClient.fetchUserInfo(idToken));
    }

    @Transactional
    public TokenResponse loginWithNaver(String accessToken) {
        return loginWithProvider(NAVER_PROVIDER, naverOAuthClient.fetchUserInfo(accessToken));
    }

    private TokenResponse loginWithProvider(String provider, SocialUserInfo socialUserInfo) {
        Optional<User> existing = userRepository.findBySocialProviderAndSocialId(
                provider, socialUserInfo.providerUserId());

        User user;
        if (existing.isPresent()) {
            user = existing.get();
        } else {
            String nickname = (socialUserInfo.nicknameHint() == null || socialUserInfo.nicknameHint().isBlank())
                    ? randomNicknameGenerator.generate()
                    : socialUserInfo.nicknameHint();
            User newUser = User.forSocialLogin(nickname, provider, socialUserInfo.providerUserId());
            user = userRepository.save(newUser);
            auditLogger.event("USER_SIGNUP", user.getId(), "provider=" + provider);
        }

        securityEventLogger.loginSuccess(provider, user.getId());
        return authService.issueToken(user.getId());
    }
}
