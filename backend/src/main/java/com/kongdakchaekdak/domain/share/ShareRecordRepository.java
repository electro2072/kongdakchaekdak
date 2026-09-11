package com.kongdakchaekdak.domain.share;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ShareRecordRepository extends JpaRepository<ShareRecord, Long> {

    List<ShareRecord> findByUserIdOrderBySharedAtDesc(Long userId);

    // Step 5-2 공개 웹뷰(/public/share/{token})에서 비로그인 사용자가 토큰만으로 조회할 때 사용.
    Optional<ShareRecord> findByPublicToken(String publicToken);

    // (G16 회원 탈퇴, 2026-09-11) AccountDeletionService 전용 — 소유 데이터 일괄 삭제.
    @Query("select s.id from ShareRecord s where s.user.id = :userId")
    List<Long> findIdsByUserId(@Param("userId") Long userId);

    // 본인 책을 가리키는 공유 기록 — 생성 시 소유자 검증이 있어 정상 데이터에선 위 결과와 같다.
    // 그래도 합쳐서 지운다: 이 행이 남으면 books FK 위반으로 탈퇴 전체가 롤백된다.
    @Query("select s.id from ShareRecord s where s.book.id in :bookIds")
    List<Long> findIdsByBookIds(@Param("bookIds") Collection<Long> bookIds);

    @Modifying(flushAutomatically = true)
    @Query("delete from ShareRecord s where s.id in :ids")
    int deleteAllByIds(@Param("ids") Collection<Long> ids);
}
