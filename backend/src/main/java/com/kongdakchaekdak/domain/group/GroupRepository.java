package com.kongdakchaekdak.domain.group;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GroupRepository extends JpaRepository<Group, Long> {

    // (G16 회원 탈퇴, 2026-09-11) AccountDeletionService 전용 — 소유 데이터 일괄 삭제.
    // 삭제는 JPQL 문자열("delete from Group ...")을 쓰지 않고 엔티티 단위 deleteAll로 한다 —
    // 엔티티명 Group이 HQL 키워드 GROUP과 겹쳐 파서 동작에 기대지 않기 위해서다.
    List<Group> findByOwnerId(Long ownerId);
}
