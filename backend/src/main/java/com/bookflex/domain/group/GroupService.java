package com.bookflex.domain.group;

import com.bookflex.common.exception.DuplicateResourceException;
import com.bookflex.common.exception.ForbiddenException;
import com.bookflex.common.exception.ResourceNotFoundException;
import com.bookflex.domain.group.dto.GroupCreateRequest;
import com.bookflex.domain.group.dto.GroupMemberAddRequest;
import com.bookflex.domain.group.dto.GroupMemberResponse;
import com.bookflex.domain.group.dto.GroupResponse;
import com.bookflex.domain.group.dto.GroupUpdateRequest;
import com.bookflex.domain.user.User;
import com.bookflex.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 그룹(독서모임/가족 등) CRUD. 생성자가 소유자(owner)가 되며 자동으로 첫 멤버로 등록된다.
 * 멤버 추가는 소유자만 가능하고, 탈퇴(제거)는 본인 스스로 또는 소유자가 할 수 있다 —
 * 단, 소유자 본인은 탈퇴할 수 없다(그룹이 주인 없는 상태가 되는 것을 막기 위함, 대신 그룹
 * 삭제를 사용해야 함). 조회(단건/목록/멤버 목록)는 User/Book과 동일한 원칙으로 열어둔다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GroupService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserRepository userRepository;

    @Transactional
    public GroupResponse create(GroupCreateRequest request, Long currentUserId) {
        User owner = findUserOrThrow(currentUserId);

        Group group = groupRepository.save(new Group(owner, request.name()));
        groupMemberRepository.save(new GroupMember(group, owner));

        return GroupResponse.from(group, 1);
    }

    public GroupResponse getById(Long groupId) {
        Group group = findGroupOrThrow(groupId);
        return GroupResponse.from(group, groupMemberRepository.countByGroupId(groupId));
    }

    public List<GroupResponse> getAll() {
        return groupRepository.findAll().stream()
                .map(group -> GroupResponse.from(group, groupMemberRepository.countByGroupId(group.getId())))
                .toList();
    }

    public List<GroupMemberResponse> listMembers(Long groupId) {
        findGroupOrThrow(groupId);
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
    }

    @Transactional
    public GroupMemberResponse addMember(Long groupId, GroupMemberAddRequest request, Long currentUserId) {
        Group group = findGroupOrThrow(groupId);
        requireOwner(group, currentUserId);

        User target = findUserOrThrow(request.userId());
        if (groupMemberRepository.existsByGroupIdAndUserId(groupId, request.userId())) {
            throw new DuplicateResourceException("이미 그룹에 속한 사용자입니다. userId=" + request.userId());
        }

        GroupMember saved = groupMemberRepository.save(new GroupMember(group, target));
        return GroupMemberResponse.from(saved);
    }

    @Transactional
    public void removeMember(Long groupId, Long targetUserId, Long currentUserId) {
        Group group = findGroupOrThrow(groupId);
        GroupMember membership = groupMemberRepository.findByGroupIdAndUserId(groupId, targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("해당 사용자는 그룹 멤버가 아닙니다. userId=" + targetUserId));

        boolean isSelf = targetUserId.equals(currentUserId);
        boolean isOwner = group.getOwner().getId().equals(currentUserId);
        if (!isSelf && !isOwner) {
            throw new ForbiddenException("본인 또는 그룹장만 멤버를 내보낼 수 있습니다.");
        }
        if (isSelf && group.getOwner().getId().equals(targetUserId)) {
            throw new ForbiddenException("그룹장은 탈퇴할 수 없습니다. 그룹을 삭제해주세요.");
        }

        groupMemberRepository.delete(membership);
    }

    private Group findGroupOrThrow(Long groupId) {
        return groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("그룹을 찾을 수 없습니다. id=" + groupId));
    }

    private User findUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다. id=" + userId));
    }

    private void requireOwner(Group group, Long currentUserId) {
        if (!group.getOwner().getId().equals(currentUserId)) {
            throw new ForbiddenException("그룹장만 수행할 수 있는 작업입니다.");
        }
    }
}
