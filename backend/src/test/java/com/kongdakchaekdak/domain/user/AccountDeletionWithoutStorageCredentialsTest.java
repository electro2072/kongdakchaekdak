package com.kongdakchaekdak.domain.user;

import com.kongdakchaekdak.domain.book.Book;
import com.kongdakchaekdak.domain.book.BookRepository;
import com.kongdakchaekdak.domain.booknote.BookNote;
import com.kongdakchaekdak.domain.booknote.BookNoteRepository;
import com.kongdakchaekdak.domain.bookphoto.BookPhoto;
import com.kongdakchaekdak.domain.bookphoto.BookPhotoRepository;
import com.kongdakchaekdak.security.JwtProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * (G16 회원 탈퇴, 2026-09-11) 스토리지 자격증명이 비어 있는 환경(G2 미설정 = 현재 운영)에서도 탈퇴가
 * 커밋까지 성공하는지 확인한다.
 *
 * <p><b>일부러 {@code @Transactional}을 붙이지 않았다.</b> 테스트 트랜잭션은 롤백되므로 커밋 후 리스너
 * ({@code BookPhotoObjectCleaner.onAccountDeleted})가 아예 실행되지 않는다 — 그러면 이 테스트가 검증하려는
 * 경로를 타지 않는다. 각 저장·요청이 실제로 커밋되고, 탈퇴가 성공하면 이 테스트가 만든 데이터는 전부 사라진다.
 *
 * <p>프로퍼티를 덮어쓰므로 별도 스프링 컨텍스트가 뜬다.
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "app.s3.access-key=",
        "app.s3.secret-key="
})
class AccountDeletionWithoutStorageCredentialsTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private JwtProvider jwtProvider;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private BookRepository bookRepository;
    @Autowired
    private BookNoteRepository bookNoteRepository;
    @Autowired
    private BookPhotoRepository bookPhotoRepository;

    @Test
    void 스토리지_자격증명이_없어도_사진이_있는_사용자의_탈퇴가_커밋되고_204() throws Exception {
        User me = userRepository.save(new User("자격증명없음", null, null, null, "kakao",
                "withdraw-no-credentials-" + UUID.randomUUID()));
        Book book = bookRepository.save(new Book(me, "사진 있는 책", "저자", null, null, null, null,
                LocalDate.of(2026, 9, 1)));
        BookNote note = bookNoteRepository.save(new BookNote(book, "소감"));
        BookPhoto photo = bookPhotoRepository.save(new BookPhoto(book,
                "https://test-bucket.s3.ap-northeast-2.amazonaws.com/book-photos/" + book.getId() + "/"
                        + UUID.randomUUID() + ".jpg",
                null, null, null));

        mockMvc.perform(delete("/api/users/{id}", me.getId())
                        .header("Authorization", "Bearer " + jwtProvider.generateToken(me.getId())))
                .andExpect(status().isNoContent());

        // 트랜잭션 밖에서 새로 읽는다 = 커밋된 상태를 본다.
        assertThat(userRepository.existsById(me.getId())).isFalse();
        assertThat(bookRepository.existsById(book.getId())).isFalse();
        assertThat(bookNoteRepository.existsById(note.getId())).isFalse();
        assertThat(bookPhotoRepository.existsById(photo.getId())).isFalse();
    }
}
