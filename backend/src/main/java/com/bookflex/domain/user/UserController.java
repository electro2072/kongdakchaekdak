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
 * 회원 CRUD API (Step 2). 소셜 로그인/인증은 Step 3에서 붙이며,
 * 그 전까지는 인증 없이 CRUD 동작만 검증하는 용도.
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User", description = "회원 CRUD API")
public class UserController {

    private final UserService userService;

    @PostMapping
    @Operation(summary = "회원 생성 (임시: 인증 없이 CRUD 검증용)")
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
