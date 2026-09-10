package com.kongdakchaekdak.domain.auth;

import com.kongdakchaekdak.common.logging.AuditLogger;
import com.kongdakchaekdak.common.logging.SecurityEventLogger;
import com.kongdakchaekdak.common.time.KstClock;
import com.kongdakchaekdak.domain.auth.dto.TokenResponse;
import com.kongdakchaekdak.domain.auth.oauth2.AppleOAuthClient;
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

import java.time.LocalDateTime;
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
 *
 * <p>2026-08-29: {@link #loginWithProvider}가 "이번 호출에서 계정을 새로 만들었는지"를
 * {@code isNewUser}로 추적해 {@link AuthService#issueToken}에 그대로 전달한다 — 프론트가
 * 로그인 성공 응답(TokenResponse.isNewUser)만 보고 신규 회원가입 화면으로 보낼지, 바로 메인
 * 화면으로 보낼지 분기할 수 있게 하기 위함이다.</p>
 *
 * <p>2026-09-07: {@link #loginWithProvider}가 로그인 성공마다(신규 가입/기존 회원 재로그인
 * 둘 다) {@code user.updateLastLoginAt(...)}을 호출한다 — "한 달 이상 미접속 사용자에게
 * 인앱 알림" 기능 설계({@code claude/독서기록앱_백엔드_비활성사용자_알림_설계_v1.md}) 반영.
 * 신규 가입자는 {@link User}의 생성자에서 이미 한 번 세팅되지만, 여기서 다시 명시적으로
 * 세팅해 "로그인 성공 = lastLoginAt 갱신"이라는 계약을 두 분기 모두에서 코드로도 분명히
 * 드러낸다(생성자 타이밍에 암묵적으로 의존하지 않음).</p>
 *
 * <p>2026-09-09: 4번째 제공자로 애플({@link #loginWithApple})을 추가했다 — iOS 전용 버튼
 * (플랫폼 판단은 프론트 담당). {@link AppleOAuthClient}가 이미 identity token 검증까지 끝낸
 * {@link SocialUserInfo}를 돌려주므로, {@link #loginWithProvider} 공통 로직은 전혀 바뀌지
 * 않는다 — 애초에 4번째 제공자를 염두에 두고 설계돼 있었다(상세: 설계 문서
 * {@code claude/독서기록앱_백엔드_애플로그인_설계_v1.md}).</p>
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SocialAuthService {

    private static final String KAKAO_PROVIDER = "kakao";
    private static final String GOOGLE_PROVIDER = "google";
    private static final String NAVER_PROVIDER = "naver";
    private static final String APPLE_PROVIDER = "apple";

    private final UserRepository userRepository;
    private final RandomNicknameGenerator randomNicknameGenerator;
    private final AuthService authService;
    private final KakaoOAuthClient kakaoOAuthClient;
    private final GoogleOAuthClient googleOAuthClient;
    private final NaverOAuthClient naverOAuthClient;
    private final AppleOAuthClient appleOAuthClient;
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

    @Transactional
    public TokenResponse loginWithApple(String identityToken) {
        return loginWithProvider(APPLE_PROVIDER, appleOAuthClient.fetchUserInfo(identityToken));
    }

    private TokenResponse loginWithProvider(String provider, SocialUserInfo socialUserInfo) {
        Optional<User> existing = userRepository.findBySocialProviderAndSocialId(
                provider, socialUserInfo.providerUserId());

        User user;
        boolean isNewUser;
        if (existing.isPresent()) {
            user = existing.get();
            isNewUser = false;
        } else {
            String nickname = (socialUserInfo.nicknameHint() == null || socialUserInfo.nicknameHint().isBlank())
                    ? randomNicknameGenerator.generate()
                    : socialUserInfo.nicknameHint();
            User newUser = User.forSocialLogin(nickname, provider, socialUserInfo.providerUserId());
            user = userRepository.save(newUser);
            auditLogger.event("USER_SIGNUP", user.getId(), "provider=" + provider);
            isNewUser = true;
        }
        // (OBS-26 확장, 2026-09-10) User 생성자와 동일하게 KST 기준으로 고정 — Book.startDate/
        // endDate와 lastLoginAt이 서로 다른 타임존 기준이면 화면에 같이 보일 때 날짜가 어긋난다.
        user.updateLastLoginAt(LocalDateTime.now(KstClock.ZONE));

        securityEventLogger.loginSuccess(provider, user.getId());
        return authService.issueToken(user.getId(), isNewUser);
    }
}
