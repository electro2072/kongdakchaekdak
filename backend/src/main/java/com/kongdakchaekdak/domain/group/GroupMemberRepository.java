package com.kongdakchaekdak.domain.group;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {

    List<GroupMember> findByGroupIdOrderByJoinedAtAsc(Long groupId);

    // (G20 확장, 2026-09-10) "본인이 속한 그룹 목록" 조회용 — GroupService.getAll(currentUserId).
    List<GroupMember> findByUserId(Long userId);

    Optional<GroupMember> findByGroupIdAndUserId(Long groupId, Long userId);

    boolean existsByGroupIdAndUserId(Long groupId, Long userId);

    long countByGroupId(Long groupId);

    void deleteByGroupId(Long groupId);
}
