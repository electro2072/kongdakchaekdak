package com.kongdakchaekdak.domain.booknote;

import com.kongdakchaekdak.common.exception.ForbiddenException;
import com.kongdakchaekdak.common.exception.ResourceNotFoundException;
import com.kongdakchaekdak.domain.book.Book;
import com.kongdakchaekdak.domain.book.BookRepository;
import com.kongdakchaekdak.domain.booknote.dto.BookNoteCreateRequest;
import com.kongdakchaekdak.domain.booknote.dto.BookNoteResponse;
import com.kongdakchaekdak.domain.booknote.dto.BookNoteUpdateRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BookPhoto와 동일한 소유자 검증 원칙: 본인 소유 책에만 소감을 작성/수정/삭제할 수 있고,
 * 조회는 Book/BookPhoto와 마찬가지로 열어둔다 (다른 회원의 소감도 구경 가능한 공유 앱 특성).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BookNoteService {

    private final BookNoteRepository bookNoteRepository;
    private final BookRepository bookRepository;

    @Transactional
    public BookNoteResponse create(Long bookId, BookNoteCreateRequest request, Long currentUserId) {
        Book book = findBookOrThrow(bookId);
        requireOwner(book, currentUserId);

        BookNote note = new BookNote(book, request.content());
        return BookNoteResponse.from(bookNoteRepository.save(note));
    }

    public List<BookNoteResponse> list(Long bookId) {
        findBookOrThrow(bookId);
        return bookNoteRepository.findByBookIdOrderByCreatedAtDesc(bookId).stream()
                .map(BookNoteResponse::from)
                .toList();
    }

    @Transactional
    public BookNoteResponse update(Long bookId, Long noteId, BookNoteUpdateRequest request, Long currentUserId) {
        BookNote note = findNoteOrThrow(bookId, noteId);
        requireOwner(note.getBook(), currentUserId);

        note.updateContent(request.content());
        return BookNoteResponse.from(note);
    }

    @Transactional
    public void delete(Long bookId, Long noteId, Long currentUserId) {
        BookNote note = findNoteOrThrow(bookId, noteId);
        requireOwner(note.getBook(), currentUserId);

        bookNoteRepository.delete(note);
    }

    private Book findBookOrThrow(Long bookId) {
        return bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("책 기록을 찾을 수 없습니다. id=" + bookId));
    }

    private BookNote findNoteOrThrow(Long bookId, Long noteId) {
        BookNote note = bookNoteRepository.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("소감을 찾을 수 없습니다. id=" + noteId));
        if (!note.getBook().getId().equals(bookId)) {
            throw new ResourceNotFoundException("해당 책 기록에 속한 소감이 아닙니다. bookId=" + bookId + ", noteId=" + noteId);
        }
        return note;
    }

    private void requireOwner(Book book, Long currentUserId) {
        if (!book.getUser().getId().equals(currentUserId)) {
            throw new ForbiddenException("본인 책 기록에만 소감을 작성/수정/삭제할 수 있습니다.");
        }
    }
}
