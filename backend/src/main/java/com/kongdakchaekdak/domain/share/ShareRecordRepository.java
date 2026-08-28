package com.kongdakchaekdak.domain.share;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ShareRecordRepository extends JpaRepository<ShareRecord, Long> {

    List<ShareRecord> findByUserIdOrderBySharedAtDesc(Long userId);

    // Step 5-2 공개 웹뷰(/public/share/{token})에서 비로그인 사용자가 토큰만으로 조회할 때 사용.
    Optional<ShareRecord> findByPublicToken(String publicToken);
}
