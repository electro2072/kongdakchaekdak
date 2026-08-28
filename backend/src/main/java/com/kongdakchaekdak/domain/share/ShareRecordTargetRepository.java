package com.kongdakchaekdak.domain.share;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ShareRecordTargetRepository extends JpaRepository<ShareRecordTarget, Long> {

    List<ShareRecordTarget> findByShareRecordId(Long shareRecordId);

    void deleteByShareRecordId(Long shareRecordId);
}
