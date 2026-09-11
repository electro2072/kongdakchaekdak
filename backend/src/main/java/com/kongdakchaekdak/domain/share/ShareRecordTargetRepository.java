package com.kongdakchaekdak.domain.share;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface ShareRecordTargetRepository extends JpaRepository<ShareRecordTarget, Long> {

    List<ShareRecordTarget> findByShareRecordId(Long shareRecordId);

    void deleteByShareRecordId(Long shareRecordId);

    // (G16 회원 탈퇴, 2026-09-11) AccountDeletionService 전용 — 소유 데이터 일괄 삭제.
    @Modifying(flushAutomatically = true)
    @Query("delete from ShareRecordTarget t where t.shareRecord.id in :shareRecordIds")
    int deleteAllByShareRecordIds(@Param("shareRecordIds") Collection<Long> shareRecordIds);

    // 타인의 공유 기록에서 탈퇴자를 공유 대상으로 지정한 행. target_id는 FK가 없어 남겨도 에러는
    // 안 나지만, 탈퇴자 식별자가 남는 데이터라 함께 지운다.
    @Modifying(flushAutomatically = true)
    @Query("delete from ShareRecordTarget t where t.targetType = :targetType and t.targetId = :targetId")
    int deleteAllByTarget(@Param("targetType") ShareTargetType targetType, @Param("targetId") Long targetId);
}
