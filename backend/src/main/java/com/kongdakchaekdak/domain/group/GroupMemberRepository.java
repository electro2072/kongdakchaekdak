package com.kongdakchaekdak.domain.group;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    // (G16 회원 탈퇴, 2026-09-11) AccountDeletionService 전용 — 소유 데이터 일괄 삭제.
    // 모임장 위임 후보 순서: joined_at 오름차순, 같으면 id 오름차순(PM 결정).
    List<GroupMember> findByGroupIdOrderByJoinedAtAscIdAsc(Long groupId);

    @Modifying(flushAutomatically = true)
    @Query("delete from GroupMember m where m.user.id = :userId")
    int deleteAllByUserId(@Param("userId") Long userId);
}
