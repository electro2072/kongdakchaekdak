package com.kongdakchaekdak.domain.user;

import com.kongdakchaekdak.domain.book.Book;
import com.kongdakchaekdak.domain.book.BookRepository;
import com.kongdakchaekdak.domain.bookphoto.BookPhoto;
import com.kongdakchaekdak.domain.bookphoto.BookPhotoRepository;
import com.kongdakchaekdak.security.JwtProvider;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;
import software.amazon.awssdk.core.exception.SdkClientException;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectsRequest;
import software.amazon.awssdk.services.s3.model.ObjectIdentifier;

import java.time.LocalDate;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * (G16 회원 탈퇴, 2026-09-11) 스토리지 삭제가 실패해도 탈퇴는 성공(204)하고, 삭제 시도는 반드시
 * <b>커밋 이후</b>에 일어나는지 확인한다.
 *
 * <p>테스트용 설정({@code src/test/resources/application.yml})에는 더미 자격증명이 들어 있어
 * {@code BookPhotoObjectCleaner}가 "설정됨"으로 판단하고 실제로 {@code S3Client}를 호출한다. 그 클라이언트를
 * {@link MockBean}으로 바꿔 네트워크 없이 예외를 던지게 한다.
 *
 * <p><b>커밋 이후인지 확인하는 방법:</b> S3 호출 시점에 <b>다른 스레드</b>(= 다른 DB 커넥션)에서 사용자를
 * 조회한다. 아직 커밋 전이라면 다른 커넥션에는 사용자가 보인다. 같은 스레드에서 조회하면 커밋 여부와
 * 무관하게 삭제된 것으로 보이므로 검증이 되지 않는다.
 *
 * <p>{@code AccountDeletionWithoutStorageCredentialsTest}와 같은 이유로 {@code @Transactional}을 붙이지 않는다.
 */
@SpringBootTest
@AutoConfigureMockMvc
class AccountDeletionStorageFailureTest {

    @MockBean
    private S3Client s3Client;

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private JwtProvider jwtProvider;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private BookRepository bookRepository;
    @Autowired
    private BookPhotoRepository bookPhotoRepository;

    @Test
    void 스토리지_삭제가_예외를_던져도_탈퇴는_204이고_삭제_시도는_커밋_후에_일어난다() throws Exception {
        User me = userRepository.save(new User("스토리지실패", null, null, null, "kakao",
                "withdraw-storage-failure-" + UUID.randomUUID()));
        Book book = bookRepository.save(new Book(me, "사진 있는 책", "저자", null, null, null, null,
                LocalDate.of(2026, 9, 1)));
        String expectedKey = "book-photos/" + book.getId() + "/" + UUID.randomUUID() + ".jpg";
        BookPhoto photo = bookPhotoRepository.save(new BookPhoto(book,
                "https://test-bucket.s3.ap-northeast-2.amazonaws.com/" + expectedKey, null, null, null));
        Long meId = me.getId();

        AtomicReference<Boolean> userVisibleFromOtherConnectionAtDeleteTime = new AtomicReference<>();
        when(s3Client.deleteObjects(any(DeleteObjectsRequest.class))).thenAnswer(invocation -> {
            userVisibleFromOtherConnectionAtDeleteTime.set(
                    CompletableFuture.supplyAsync(() -> userRepository.existsById(meId)).get(10, TimeUnit.SECONDS));
            throw SdkClientException.create("테스트: 스토리지 연결 실패");
        });

        mockMvc.perform(delete("/api/users/{id}", meId)
                        .header("Authorization", "Bearer " + jwtProvider.generateToken(meId)))
                .andExpect(status().isNoContent());

        ArgumentCaptor<DeleteObjectsRequest> captor = ArgumentCaptor.forClass(DeleteObjectsRequest.class);
        verify(s3Client).deleteObjects(captor.capture());
        assertThat(captor.getValue().bucket()).isEqualTo("test-bucket");
        assertThat(captor.getValue().delete().objects()).extracting(ObjectIdentifier::key).containsExactly(expectedKey);

        assertThat(userVisibleFromOtherConnectionAtDeleteTime.get())
                .as("S3 삭제 시점에 다른 커넥션에서 사용자가 이미 안 보여야 한다(= 커밋 후 호출)")
                .isFalse();

        assertThat(userRepository.existsById(meId)).isFalse();
        assertThat(bookRepository.existsById(book.getId())).isFalse();
        assertThat(bookPhotoRepository.existsById(photo.getId())).isFalse();
    }
}
