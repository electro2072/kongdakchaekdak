package com.bookflex.domain.auth;

import com.bookflex.domain.auth.dto.GoogleIdTokenRequest;
import com.bookflex.domain.auth.dto.LoginRequest;
import com.bookflex.domain.auth.dto.SignupRequest;
import com.bookflex.domain.auth.dto.SocialAccessTokenRequest;
import com.bookflex.domain.auth.dto.TokenResponse;
import com.bookflex.domain.user.dto.UserResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 인증 API. 이메일/PW(Step 3-a)에 이어 카카오/구글/네이버 소셜 로그인(Step 3-b)을 제공한다.
 * 소셜 로그인은 모바일 앱이 각 제공자 SDK로 이미 받아온 토큰을 그대로 넘겨받는 방식이라
 * (SocialAuthService 참고), 프론트에서 카카오/구글/네이버 SDK 연동이 끝나야 실제로 끝까지 테스트할 수 있다.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "인증 API (이메일/PW + 소셜 로그인)")
public class AuthController {

    private final AuthService authService;
    private final SocialAuthService socialAuthService;

    @PostMapping("/signup")
    @Operation(summary = "이메일/PW 회원가입 후 토큰 발급")
    public ResponseEntity<TokenResponse> signup(@Valid @RequestBody SignupRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.signup(request));
    }

    @PostMapping("/login")
    @Operation(summary = "이메일/PW 로그인 후 토큰 발급")
    public TokenResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/kakao")
    @Operation(summary = "카카오 로그인 (모바일 앱이 카카오 SDK로 받은 access token 전달) 후 토큰 발급")
    public TokenResponse kakaoLogin(@Valid @RequestBody SocialAccessTokenRequest request) {
        return socialAuthService.loginWithKakao(request.accessToken());
    }

    @PostMapping("/google")
    @Operation(summary = "구글 로그인 (모바일 앱이 구글 SDK로 받은 ID token 전달) 후 토큰 발급")
    public TokenResponse googleLogin(@Valid @RequestBody GoogleIdTokenRequest request) {
        return socialAuthService.loginWithGoogle(request.idToken());
    }

    @PostMapping("/naver")
    @Operation(summary = "네이버 로그인 (모바일 앱이 네이버 SDK로 받은 access token 전달) 후 토큰 발급")
    public TokenResponse naverLogin(@Valid @RequestBody SocialAccessTokenRequest request) {
        return socialAuthService.loginWithNaver(request.accessToken());
    }

    @GetMapping("/me")
    @Operation(summary = "현재 로그인한 사용자 정보 조회 (Authorization: Bearer {token} 필요)")
    public UserResponse me(@AuthenticationPrincipal Long userId) {
        return authService.me(userId);
    }
}
