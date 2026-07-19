package com.bookflex.domain.auth;

import com.bookflex.domain.auth.dto.LoginRequest;
import com.bookflex.domain.auth.dto.SignupRequest;
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
 * 이메일/PW 인증 API (Step 3-a). 카카오 등 실제 소셜 로그인은 이후 단계에서
 * 별도 엔드포인트(예: /api/auth/kakao)로 추가한다.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "이메일/PW 인증 API")
public class AuthController {

    private final AuthService authService;

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

    @GetMapping("/me")
    @Operation(summary = "현재 로그인한 사용자 정보 조회 (Authorization: Bearer {token} 필요)")
    public UserResponse me(@AuthenticationPrincipal Long userId) {
        return authService.me(userId);
    }
}
