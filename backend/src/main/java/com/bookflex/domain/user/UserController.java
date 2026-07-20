package com.bookflex.domain.user;

import com.bookflex.domain.user.dto.UserCreateRequest;
import com.bookflex.domain.user.dto.UserResponse;
import com.bookflex.domain.user.dto.UserUpdateRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 회원 CRUD API (Step 2). Step 3부터 인증(Authorization: Bearer {token})이 필요하다
 * (SecurityConfig 참고). 조회(단건/목록)는 다른 회원 정보도 볼 수 있게 열려 있지만(공유 앱 특성),
 * 수정/삭제는 본인 계정에 대해서만 가능하도록 소유자 검증이 적용되어 있다 (UserService 참고).
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User", description = "회원 CRUD API")
public class UserController {

    private final UserService userService;

    @PostMapping
    @Operation(summary = "회원 생성 (관리자/테스트용 — 실제 가입은 POST /api/auth/signup 사용)")
    public ResponseEntity<UserResponse> create(@Valid @RequestBody UserCreateRequest request) {
        UserResponse response = userService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "회원 단건 조회")
    public UserResponse getById(@PathVariable Long id) {
        return userService.getById(id);
    }

    @GetMapping
    @Operation(summary = "회원 전체 목록 조회")
    public List<UserResponse> getAll() {
        return userService.getAll();
    }

    @PatchMapping("/{id}")
    @Operation(summary = "회원 프로필 부분 수정 (본인만 가능)")
    public UserResponse update(@PathVariable Long id, @Valid @RequestBody UserUpdateRequest request,
                                @AuthenticationPrincipal Long currentUserId) {
        return userService.update(id, request, currentUserId);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "회원 삭제 (본인만 가능)")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal Long currentUserId) {
        userService.delete(id, currentUserId);
        return ResponseEntity.noContent().build();
    }
}
