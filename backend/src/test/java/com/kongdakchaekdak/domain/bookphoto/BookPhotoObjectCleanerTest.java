package com.kongdakchaekdak.domain.bookphoto;

import com.kongdakchaekdak.config.S3Properties;
import com.kongdakchaekdak.domain.user.AccountDeletedEvent;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.BeanCreationException;
import software.amazon.awssdk.core.exception.SdkClientException;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectsRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectsResponse;
import software.amazon.awssdk.services.s3.model.ObjectIdentifier;
import software.amazon.awssdk.services.s3.model.S3Error;

import java.util.List;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * (G16 회원 탈퇴, 2026-09-11) {@link BookPhotoObjectCleaner} 단위 테스트.
 * 핵심 계약: 어떤 실패도 밖으로 던지지 않는다 / 설정이 없으면 S3를 건드리지 않는다.
 */
class BookPhotoObjectCleanerTest {

    private static final S3Properties CONFIGURED =
            new S3Properties("test-bucket", "ap-northeast-2", "access", "secret", 600L);

    private final S3Client s3Client = mock(S3Client.class);

    @Test
    void 자격증명이_비어_있으면_S3를_호출하지_않는다() {
        BookPhotoObjectCleaner cleaner = new BookPhotoObjectCleaner(s3Client,
                new S3Properties("test-bucket", "ap-northeast-2", "", "", 600L));

        cleaner.deleteQuietly(List.of("book-photos/1/a.jpg"));

        verifyNoInteractions(s3Client);
    }

    @Test
    void 버킷이_비어_있어도_S3를_호출하지_않는다() {
        BookPhotoObjectCleaner cleaner = new BookPhotoObjectCleaner(s3Client,
                new S3Properties(null, "ap-northeast-2", "access", "secret", 600L));

        cleaner.deleteQuietly(List.of("book-photos/1/a.jpg"));

        verifyNoInteractions(s3Client);
    }

    @Test
    void 대상이_없으면_S3를_호출하지_않는다() {
        BookPhotoObjectCleaner cleaner = new BookPhotoObjectCleaner(s3Client, CONFIGURED);

        cleaner.deleteQuietly(List.of());
        cleaner.deleteQuietly(null);

        verifyNoInteractions(s3Client);
    }

    @Test
    void 설정이_있으면_버킷과_key로_DeleteObjects를_보낸다() {
        BookPhotoObjectCleaner cleaner = new BookPhotoObjectCleaner(s3Client, CONFIGURED);

        cleaner.onAccountDeleted(new AccountDeletedEvent(7L, List.of("book-photos/1/a.jpg", "book-photos/2/b.png")));

        ArgumentCaptor<DeleteObjectsRequest> captor = ArgumentCaptor.forClass(DeleteObjectsRequest.class);
        verify(s3Client).deleteObjects(captor.capture());
        assertThat(captor.getValue().bucket()).isEqualTo("test-bucket");
        assertThat(captor.getValue().delete().objects()).extracting(ObjectIdentifier::key)
                .containsExactly("book-photos/1/a.jpg", "book-photos/2/b.png");
    }

    @Test
    void S3_호출이_예외를_던져도_밖으로_던지지_않는다() {
        when(s3Client.deleteObjects(any(DeleteObjectsRequest.class)))
                .thenThrow(SdkClientException.create("연결 실패"));
        BookPhotoObjectCleaner cleaner = new BookPhotoObjectCleaner(s3Client, CONFIGURED);

        assertThatCode(() -> cleaner.deleteQuietly(List.of("book-photos/1/a.jpg"))).doesNotThrowAnyException();
    }

    @Test
    void 지연_클라이언트_생성이_실패해도_밖으로_던지지_않는다() {
        // @Lazy 프록시가 첫 호출에서 빈을 만들다 실패하면 BeanCreationException으로 올라온다.
        when(s3Client.deleteObjects(any(DeleteObjectsRequest.class)))
                .thenThrow(new BeanCreationException("s3Client", "자격증명 오류"));
        BookPhotoObjectCleaner cleaner = new BookPhotoObjectCleaner(s3Client, CONFIGURED);

        assertThatCode(() -> cleaner.deleteQuietly(List.of("book-photos/1/a.jpg"))).doesNotThrowAnyException();
    }

    @Test
    void 일부_key_삭제_실패_응답이어도_밖으로_던지지_않는다() {
        when(s3Client.deleteObjects(any(DeleteObjectsRequest.class))).thenReturn(DeleteObjectsResponse.builder()
                .errors(S3Error.builder().key("book-photos/1/a.jpg").code("AccessDenied").build())
                .build());
        BookPhotoObjectCleaner cleaner = new BookPhotoObjectCleaner(s3Client, CONFIGURED);

        assertThatCode(() -> cleaner.deleteQuietly(List.of("book-photos/1/a.jpg"))).doesNotThrowAnyException();
    }

    @Test
    void key가_1000개를_넘으면_요청을_나눠_보낸다() {
        BookPhotoObjectCleaner cleaner = new BookPhotoObjectCleaner(s3Client, CONFIGURED);
        List<String> keys = IntStream.range(0, BookPhotoObjectCleaner.MAX_KEYS_PER_REQUEST + 1)
                .mapToObj(i -> "book-photos/1/k" + i + ".jpg")
                .toList();

        cleaner.deleteQuietly(keys);

        ArgumentCaptor<DeleteObjectsRequest> captor = ArgumentCaptor.forClass(DeleteObjectsRequest.class);
        verify(s3Client, times(2)).deleteObjects(captor.capture());
        assertThat(captor.getAllValues().get(0).delete().objects()).hasSize(BookPhotoObjectCleaner.MAX_KEYS_PER_REQUEST);
        assertThat(captor.getAllValues().get(1).delete().objects()).hasSize(1);
    }
}
