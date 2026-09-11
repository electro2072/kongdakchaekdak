package com.kongdakchaekdak.domain.user;

import java.util.List;

/**
 * (G16 회원 탈퇴, 2026-09-11) 회원 탈퇴 트랜잭션 안에서 발행되고, <b>커밋된 뒤에만</b> 소비된다
 * ({@code @TransactionalEventListener(phase = AFTER_COMMIT)}).
 *
 * <p>DB 밖의 정리(스토리지 오브젝트 삭제 등)를 여기에 붙인다. 커밋 전에 지우면 DB가 롤백됐을 때
 * 사진 행은 남고 파일만 사라지고, 커밋 전에 실패를 던지면 탈퇴 자체가 롤백되기 때문이다.
 *
 * @param userId            탈퇴한 사용자 id (이미 DB에 없음)
 * @param photoObjectKeys   삭제 대상 스토리지 key — {@code BookPhotoObjectKeys} 규칙을 통과한 것만
 */
public record AccountDeletedEvent(Long userId, List<String> photoObjectKeys) {

    public AccountDeletedEvent {
        photoObjectKeys = photoObjectKeys == null ? List.of() : List.copyOf(photoObjectKeys);
    }
}
