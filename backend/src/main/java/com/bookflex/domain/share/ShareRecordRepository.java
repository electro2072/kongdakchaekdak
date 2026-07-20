package com.bookflex.domain.share;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ShareRecordRepository extends JpaRepository<ShareRecord, Long> {

    List<ShareRecord> findByUserIdOrderBySharedAtDesc(Long userId);
}
