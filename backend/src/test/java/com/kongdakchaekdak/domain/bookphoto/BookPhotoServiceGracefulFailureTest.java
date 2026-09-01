package com.kongdakchaekdak.domain.bookphoto;

import com.kongdakchaekdak.common.exception.ImageStorageUnavailableException;
import com.kongdakchaekdak.config.S3Properties;
import com.kongdakchaekdak.domain.book.Book;
import com.kongdakchaekdak.domain.book.BookRepository;
import com.kongdakchaekdak.domain.bookphoto.dto.PresignedUrlRequest;
import com.kongdakchaekdak.domain.user.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * (2026-08-31, BUG-20260827-03 "조각2") {@code S3Presigner}가 자격증명 문제로 예외를 던졌을 때
 * {@link BookPhotoService}가 이를 그대로 흘려보내지 않고 {@link ImageStorageUnavailableException}으로
 * 감싸는지 확인하는 순수 단위 테스트.
 *
 * <p>진짜로 "자격증명이 빈 문자열인 상태"를 재현하려면 {@code app.s3.access-key}를 빈 값으로 덮어쓴
 * 별도 Spring 컨텍스트(테스트 프로퍼티 오버라이드)가 필요한데, 이 테스트가 확인하려는 건
 * {@code BookPhotoService}의 예외 변환 책임 하나뿐이라 그 정도 컨텍스트 기동 비용을 들일 이유가 없다고
 * 판단해, {@link S3Presigner}를 Mockito로 직접 실패시키는 방식을 택했다 — {@code BookPhotoControllerTest}의
 * {@code presigned_url을_정상_발급받는다()}가 이미 정상 경로(실제 더미 자격증명으로 실제 서명 계산)를
 * 커버하고 있어, 이 테스트는 그 정상 경로와 겹치지 않는 실패 경로만 추가로 다룬다.</p>
 */
@ExtendWith(MockitoExtension.class)
class BookPhotoServiceGracefulFailureTest {

    @Mock
    private BookPhotoRepository bookPhotoRepository;
    @Mock
    private BookRepository bookRepository;
    @Mock
    private S3Presigner s3Presigner;

    @Test
    void 자격증명_문제로_presign이_실패하면_ImageStorageUnavailableException으로_변환된다() {
        User owner = mock(User.class);
        when(owner.getId()).thenReturn(1L);

        Book book = mock(Book.class);
        when(book.getUser()).thenReturn(owner);
        when(bookRepository.findById(10L)).thenReturn(Optional.of(book));

        // AwsBasicCredentials.create(...)가 빈 자격증명을 거부할 때 실제로 던지는 것과 같은 계열의
        // 예외(IllegalArgumentException)로 재현한다.
        when(s3Presigner.presignPutObject(any(PutObjectPresignRequest.class)))
                .thenThrow(new IllegalArgumentException("accessKeyId must not be blank"));

        S3Properties s3Properties = new S3Properties("test-bucket", "ap-northeast-2", "", "", 600L);
        BookPhotoService service = new BookPhotoService(bookPhotoRepository, bookRepository, s3Presigner, s3Properties);
        PresignedUrlRequest request = new PresignedUrlRequest("cafe.jpg", "image/jpeg");

        assertThatThrownBy(() -> service.issuePresignedUploadUrl(10L, request, 1L))
                .isInstanceOf(ImageStorageUnavailableException.class)
                .hasCauseInstanceOf(IllegalArgumentException.class);
    }
}
