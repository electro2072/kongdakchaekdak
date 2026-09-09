package com.kongdakchaekdak.domain.group;

import com.kongdakchaekdak.domain.group.dto.GroupCreateRequest;
import com.kongdakchaekdak.domain.group.dto.GroupMemberAddRequest;
import com.kongdakchaekdak.domain.group.dto.GroupMemberResponse;
import com.kongdakchaekdak.domain.group.dto.GroupResponse;
import com.kongdakchaekdak.domain.group.dto.GroupUpdateRequest;
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
 * 그룹(독서모임/가족 등) CRUD + 멤버 관리 API (Step 5). 생성자가 소유자가 되고 자동으로
 * 첫 멤버가 된다. 그룹 정보 수정/삭제/멤버 추가는 소유자만, 멤버 제거는 본인 또는 소유자가
 * 가능하다 (GroupService 참고).
 *
 * <p><b>(G20 확장, 2026-09-10)</b> 조회(목록/단건/멤버 목록)는 더 이상 무조건 열려있지 않다 —
 * 목록은 본인이 속한 그룹만 반환하고, 단건/멤버 목록은 요청자가 해당 그룹의 멤버인지 확인한다.
 */
@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
@Tag(name = "Group", description = "그룹(독서모임 등) CRUD + 멤버 관리 API")
public class GroupController {

    private final GroupService groupService;

    @PostMapping
    @Operation(summary = "그룹 생성 (생성자가 소유자 + 자동 첫 멤버가 됨)")
    public ResponseEntity<GroupResponse> create(@Valid @RequestBody GroupCreateRequest request,
                                                  @AuthenticationPrincipal Long currentUserId) {
        GroupResponse response = groupService.create(request, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "그룹 단건 조회 (그룹 멤버만 가능)")
    public GroupResponse getById(@PathVariable Long id, @AuthenticationPrincipal Long currentUserId) {
        return groupService.getById(id, currentUserId);
    }

    @GetMapping
    @Operation(summary = "본인이 속한 그룹 목록 조회")
    public List<GroupResponse> getAll(@AuthenticationPrincipal Long currentUserId) {
        return groupService.getAll(currentUserId);
    }

    @PatchMapping("/{id}")
    @Operation(summary = "그룹명 수정 (소유자만 가능)")
    public GroupResponse update(@PathVariable Long id, @Valid @RequestBody GroupUpdateRequest request,
                                 @AuthenticationPrincipal Long currentUserId) {
        return groupService.update(id, request, currentUserId);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "그룹 삭제 (소유자만 가능)")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal Long currentUserId) {
        groupService.delete(id, currentUserId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/members")
    @Operation(summary = "그룹 멤버 목록 조회 (그룹 멤버만 가능)")
    public List<GroupMemberResponse> listMembers(@PathVariable Long id, @AuthenticationPrincipal Long currentUserId) {
        return groupService.listMembers(id, currentUserId);
    }

    @PostMapping("/{id}/members")
    @Operation(summary = "그룹 멤버 추가 (소유자만 가능)")
    public ResponseEntity<GroupMemberResponse> addMember(@PathVariable Long id,
                                                           @Valid @RequestBody GroupMemberAddRequest request,
                                                           @AuthenticationPrincipal Long currentUserId) {
        GroupMemberResponse response = groupService.addMember(id, request, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{id}/members/{userId}")
    @Operation(summary = "그룹 멤버 제거/탈퇴 (본인 또는 소유자만 가능, 소유자 본인 탈퇴는 불가)")
    public ResponseEntity<Void> removeMember(@PathVariable Long id, @PathVariable Long userId,
                                              @AuthenticationPrincipal Long currentUserId) {
        groupService.removeMember(id, userId, currentUserId);
        return ResponseEntity.noContent().build();
    }
}
