package com.kongdakchaekdak.domain.share;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface ShareRecordPhotoRepository extends JpaRepository<ShareRecordPhoto, Long> {

    List<ShareRecordPhoto> findByShareRecordIdOrderByDisplayOrderAsc(Long shareRecordId);

    void deleteByShareRecordId(Long shareRecordId);

    // (G16 회원 탈퇴, 2026-09-11) AccountDeletionService 전용 — 소유 데이터 일괄 삭제.
    @Modifying(flushAutomatically = true)
    @Query("delete from ShareRecordPhoto p where p.shareRecord.id in :shareRecordIds")
    int deleteAllByShareRecordIds(@Param("shareRecordIds") Collection<Long> shareRecordIds);
}
