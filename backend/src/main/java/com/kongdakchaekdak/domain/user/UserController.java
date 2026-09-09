package com.kongdakchaekdak.domain.user;

import com.kongdakchaekdak.domain.user.dto.UserCreateRequest;
import com.kongdakchaekdak.domain.user.dto.UserResponse;
import com.kongdakchaekdak.domain.user.dto.UserUpdateRequest;
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

/**
 * 회원 CRUD API (Step 2). Step 3부터 인증(Authorization: Bearer {token})이 필요하다
 * (SecurityConfig 참고).
 *
 * <p><b>(G20 확장, 2026-09-10)</b> 원래 조회(단건/목록)는 다른 회원 정보도 볼 수 있게 열려 있었으나,
 * 인증만 되어 있으면 누구든 타인 계정을 조회하거나(getById) 전 회원 명부를 그대로 받아갈 수
 * 있는(getAll) 문제였다(BookController의 G20과 동일한 패턴). 단건 조회는 본인 계정만 가능하도록
 * 소유자 검증을 추가했고(추후 그룹 기능에서 타인 프로필 조회가 필요해지면 별도로 열 것), 전체 목록
 * 조회는 프론트 호출부가 없어 엔드포인트 자체를 삭제했다. 수정/삭제는 기존과 동일하게 본인 계정에
 * 대해서만 가능하다 (UserService 참고).
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
    @Operation(summary = "회원 단건 조회 (본인만 가능)")
    public UserResponse getById(@PathVariable Long id, @AuthenticationPrincipal Long currentUserId) {
        return userService.getById(id, currentUserId);
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
