package com.kongdakchaekdak.domain.group;

import com.kongdakchaekdak.common.exception.ErrorCode;
import com.kongdakchaekdak.common.exception.DuplicateResourceException;
import com.kongdakchaekdak.common.exception.ForbiddenException;
import com.kongdakchaekdak.common.exception.ResourceNotFoundException;
import com.kongdakchaekdak.common.logging.AuditLogger;
import com.kongdakchaekdak.domain.group.dto.GroupCreateRequest;
import com.kongdakchaekdak.domain.group.dto.GroupMemberAddRequest;
import com.kongdakchaekdak.domain.group.dto.GroupMemberResponse;
import com.kongdakchaekdak.domain.group.dto.GroupResponse;
import com.kongdakchaekdak.domain.group.dto.GroupUpdateRequest;
import com.kongdakchaekdak.domain.user.User;
import com.kongdakchaekdak.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 그룹(독서모임/가족 등) CRUD. 생성자가 소유자(owner)가 되며 자동으로 첫 멤버로 등록된다.
 * 멤버 추가는 소유자만 가능하고, 탈퇴(제거)는 본인 스스로 또는 소유자가 할 수 있다 —
 * 단, 소유자 본인은 탈퇴할 수 없다(그룹이 주인 없는 상태가 되는 것을 막기 위함, 대신 그룹
 * 삭제를 사용해야 함).
 *
 * <p><b>(G20 확장, 2026-09-10)</b> 조회(목록/단건/멤버 목록)는 더 이상 무조건 열려있지 않다 —
 * BookController/UserController의 G20과 같은 패턴으로, 인증만 되어 있으면 자신이 속하지 않은
 * 그룹의 존재·멤버 명단까지 그대로 노출되는 문제였다. 이제 목록 조회는 본인이 속한 그룹만
 * 반환하고, 단건/멤버 목록 조회는 요청자가 해당 그룹의 멤버인지 확인해 아니면 403
 * (NOT_GROUP_MEMBER)으로 거부한다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GroupService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserRepository userRepository;
    private final AuditLogger auditLogger;

    @Transactional
    public GroupResponse create(GroupCreateRequest request, Long currentUserId) {
        User owner = findUserOrThrow(currentUserId);

        Group group = groupRepository.save(new Group(owner, request.name()));
        groupMemberRepository.save(new GroupMember(group, owner));

        auditLogger.event("GROUP_CREATED", currentUserId, "groupId=" + group.getId() + ", name=" + request.name());
        return GroupResponse.from(group, 1);
    }

    public GroupResponse getById(Long groupId, Long currentUserId) {
        Group group = findGroupOrThrow(groupId);
        requireMember(groupId, currentUserId);
        return GroupResponse.from(group, groupMemberRepository.countByGroupId(groupId));
    }

    // (G20 확장, 2026-09-10) 전 그룹 목록이 아니라 본인이 속한 그룹만 반환한다.
    public List<GroupResponse> getAll(Long currentUserId) {
        return groupMemberRepository.findByUserId(currentUserId).stream()
                .map(GroupMember::getGroup)
                .map(group -> GroupResponse.from(group, groupMemberRepository.countByGroupId(group.getId())))
                .toList();
    }

    public List<GroupMemberResponse> listMembers(Long groupId, Long currentUserId) {
        findGroupOrThrow(groupId);
        requireMember(groupId, currentUserId);
        return groupMemberRepository.findByGroupIdOrderByJoinedAtAsc(groupId).stream()
                .map(GroupMemberResponse::from)
                .toList();
    }

    @Transactional
    public GroupResponse update(Long groupId, GroupUpdateRequest request, Long currentUserId) {
        Group group = findGroupOrThrow(groupId);
        requireOwner(group, currentUserId);

        group.rename(request.name());
        return GroupResponse.from(group, groupMemberRepository.countByGroupId(groupId));
    }

    @Transactional
    public void delete(Long groupId, Long currentUserId) {
        Group group = findGroupOrThrow(groupId);
        requireOwner(group, currentUserId);

        groupMemberRepository.deleteByGroupId(groupId);
        groupRepository.delete(group);
        auditLogger.event("GROUP_DELETED", currentUserId, "groupId=" + groupId);
    }

    @Transactional
    public GroupMemberResponse addMember(Long groupId, GroupMemberAddRequest request, Long currentUserId) {
        Group group = findGroupOrThrow(groupId);
        requireOwner(group, currentUserId);

        User target = findUserOrThrow(request.userId());
        if (groupMemberRepository.existsByGroupIdAndUserId(groupId, request.userId())) {
            throw new DuplicateResourceException(ErrorCode.ALREADY_GROUP_MEMBER, "이미 그룹에 속한 사용자입니다. userId=" + request.userId());
        }

        GroupMember saved = groupMemberRepository.save(new GroupMember(group, target));
        return GroupMemberResponse.from(saved);
    }

    @Transactional
    public void removeMember(Long groupId, Long targetUserId, Long currentUserId) {
        Group group = findGroupOrThrow(groupId);
        GroupMember membership = groupMemberRepository.findByGroupIdAndUserId(groupId, targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.NOT_FOUND, "해당 사용자는 그룹 멤버가 아닙니다. userId=" + targetUserId));

        boolean isSelf = targetUserId.equals(currentUserId);
        boolean isOwner = group.getOwner().getId().equals(currentUserId);
        if (!isSelf && !isOwner) {
            throw new ForbiddenException(ErrorCode.GROUP_LEADER_ONLY, "본인 또는 그룹장만 멤버를 내보낼 수 있습니다.");
        }
        if (isSelf && group.getOwner().getId().equals(targetUserId)) {
            throw new ForbiddenException(ErrorCode.GROUP_LEADER_CANNOT_LEAVE, "그룹장은 탈퇴할 수 없습니다. 그룹을 삭제해주세요.");
        }

        groupMemberRepository.delete(membership);
    }

    private Group findGroupOrThrow(Long groupId) {
        return groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.NOT_FOUND, "그룹을 찾을 수 없습니다. id=" + groupId));
    }

    private User findUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.NOT_FOUND, "사용자를 찾을 수 없습니다. id=" + userId));
    }

    private void requireOwner(Group group, Long currentUserId) {
        if (!group.getOwner().getId().equals(currentUserId)) {
            throw new ForbiddenException(ErrorCode.GROUP_LEADER_ONLY, "그룹장만 수행할 수 있는 작업입니다.");
        }
    }

    // (G20 확장, 2026-09-10) 그룹 단건/멤버 목록 조회는 그룹 멤버에게만 허용한다.
    private void requireMember(Long groupId, Long currentUserId) {
        if (!groupMemberRepository.existsByGroupIdAndUserId(groupId, currentUserId)) {
            throw new ForbiddenException(ErrorCode.NOT_GROUP_MEMBER, "그룹 멤버만 조회할 수 있습니다.");
        }
    }
}
