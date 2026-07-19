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
 * (SecurityConfig 참고). 아직 "본인 정보만 수정/삭제 가능" 같은 소유자 검증은 없고,
 * 로그인만 되어 있으면 다른 회원의 정보도 조회/수정 가능한 상태 — 이후 단계에서 강화 예정.
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
    @Operation(summary = "회원 프로필 부분 수정")
    public UserResponse update(@PathVariable Long id, @Valid @RequestBody UserUpdateRequest request) {
        return userService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "회원 삭제")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
