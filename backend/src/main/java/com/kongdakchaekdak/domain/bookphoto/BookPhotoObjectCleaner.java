package com.kongdakchaekdak.domain.bookphoto;

import com.kongdakchaekdak.config.S3Properties;
import com.kongdakchaekdak.domain.user.AccountDeletedEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.Delete;
import software.amazon.awssdk.services.s3.model.DeleteObjectsRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectsResponse;
import software.amazon.awssdk.services.s3.model.ObjectIdentifier;

import java.util.Collection;
import java.util.List;

/**
 * (G16 회원 탈퇴, 2026-09-11) 탈퇴가 <b>커밋된 뒤</b> 사진 오브젝트를 스토리지에서 지운다. best-effort다.
 *
 * <p><b>이 클래스는 절대 예외를 밖으로 던지지 않는다.</b> 탈퇴는 이미 커밋됐고, 스토리지 실패로
 * 사용자가 "탈퇴 실패"를 보면 안 된다. 실패하면 남은 key를 ERROR 로그에 남기고 끝낸다 —
 * 수동 정리의 근거가 로그뿐이므로 key 목록을 반드시 함께 찍는다(key는 UUID 경로라 개인 식별 정보가 아니다).
 *
 * <p>스토리지가 설정되지 않은 환경(G2 이전)에서는 S3 클라이언트를 만들지도 않고 건너뛴다.
 * 이때 남는 오브젝트는 없다 — 설정 전에는 업로드 자체가 불가능하기 때문이다.
 *
 * <p>요청 스레드에서 동기로 실행되므로 지연 상한을 {@code S3Config}의 타임아웃으로 묶어 둔다.
 */
@Slf4j
@Component
public class BookPhotoObjectCleaner {

    /** S3 DeleteObjects 한 번에 보낼 수 있는 최대 key 수. */
    static final int MAX_KEYS_PER_REQUEST = 1000;

    private final S3Client s3Client;
    private final S3Properties s3Properties;

    // S3Presigner와 같은 이유(BookPhotoService Javadoc 조각1)로 생성자 파라미터에 @Lazy — 자격증명이
    // 없어도 서버 기동이 깨지지 않고, 실제 삭제를 시도하는 시점까지 클라이언트 생성을 미룬다.
    public BookPhotoObjectCleaner(@Lazy S3Client s3Client, S3Properties s3Properties) {
        this.s3Client = s3Client;
        this.s3Properties = s3Properties;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onAccountDeleted(AccountDeletedEvent event) {
        deleteQuietly(event.photoObjectKeys());
    }

    public void deleteQuietly(Collection<String> objectKeys) {
        if (objectKeys == null || objectKeys.isEmpty()) {
            return;
        }
        List<String> keys = List.copyOf(objectKeys);
        if (!isStorageConfigured()) {
            log.warn("사진 오브젝트 삭제 건너뜀 — 스토리지 미설정(G2). 대상 {}개: {}", keys.size(), keys);
            return;
        }
        for (int from = 0; from < keys.size(); from += MAX_KEYS_PER_REQUEST) {
            deleteChunkQuietly(keys.subList(from, Math.min(from + MAX_KEYS_PER_REQUEST, keys.size())));
        }
    }

    private void deleteChunkQuietly(List<String> keys) {
        try {
            DeleteObjectsRequest request = DeleteObjectsRequest.builder()
                    .bucket(s3Properties.bucket())
                    .delete(Delete.builder()
                            .objects(keys.stream().map(key -> ObjectIdentifier.builder().key(key).build()).toList())
                            .quiet(true)
                            .build())
                    .build();
            DeleteObjectsResponse response = s3Client.deleteObjects(request);
            if (response != null && response.hasErrors() && !response.errors().isEmpty()) {
                log.error("사진 오브젝트 일부 삭제 실패 — 수동 정리 필요. 실패 {}개: {}", response.errors().size(),
                        response.errors().stream().map(error -> error.key() + "(" + error.code() + ")").toList());
            }
        } catch (RuntimeException e) {
            // SdkException(네트워크·권한), BeansException(@Lazy 클라이언트 생성 실패) 등 전부.
            log.error("사진 오브젝트 삭제 실패 — 수동 정리 필요. 대상 {}개: {}", keys.size(), keys, e);
        }
    }

    private boolean isStorageConfigured() {
        return notBlank(s3Properties.bucket())
                && notBlank(s3Properties.accessKey())
                && notBlank(s3Properties.secretKey());
    }

    private static boolean notBlank(String value) {
        return value != null && !value.isBlank();
    }
}
