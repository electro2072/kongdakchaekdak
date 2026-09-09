package com.kongdakchaekdak.domain.book;

import com.kongdakchaekdak.common.exception.ErrorCode;
import com.kongdakchaekdak.common.exception.ForbiddenException;
import com.kongdakchaekdak.common.exception.ResourceNotFoundException;
import com.kongdakchaekdak.common.logging.AuditLogger;
import com.kongdakchaekdak.domain.book.dto.BookCreateRequest;
import com.kongdakchaekdak.domain.book.dto.BookResponse;
import com.kongdakchaekdak.domain.book.dto.BookUpdateRequest;
import com.kongdakchaekdak.domain.user.User;
import com.kongdakchaekdak.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BookService {

    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final AuditLogger auditLogger;

    @Transactional
    public BookResponse create(BookCreateRequest request, Long currentUserId) {
        if (!request.userId().equals(currentUserId)) {
            throw new ForbiddenException(ErrorCode.NOT_OWNER, "본인 명의로만 책을 등록할 수 있습니다.");
        }

        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.NOT_FOUND, "사용자를 찾을 수 없습니다. id=" + request.userId()));

        Book book = new Book(
                user,
                request.title(),
                request.author(),
                request.coverImage(),
                request.isbn(),
                request.genre(),
                request.totalPages(),
                request.startDate()
        );
        Book saved = bookRepository.save(book);
        auditLogger.event("BOOK_REGISTERED", currentUserId, "bookId=" + saved.getId() + ", title=" + saved.getTitle());
        return BookResponse.from(saved);
    }

    public BookResponse getById(Long id) {
        return BookResponse.from(findBookOrThrow(id));
    }

    public List<BookResponse> search(Long userId, BookStatus status) {
        List<Book> books;
        if (userId != null && status != null) {
            books = bookRepository.findByUserIdAndStatus(userId, status);
        } else if (userId != null) {
            books = bookRepository.findByUserId(userId);
        } else if (status != null) {
            books = bookRepository.findByStatus(status);
        } else {
            books = bookRepository.findAll();
        }
        return books.stream().map(BookResponse::from).toList();
    }

    @Transactional
    public BookResponse update(Long id, BookUpdateRequest request, Long currentUserId) {
        Book book = findBookOrThrow(id);
        requireOwner(book, currentUserId);
        book.update(request.title(), request.author(), request.coverImage(),
                request.isbn(), request.genre(), request.totalPages());
        return BookResponse.from(book);
    }

    @Transactional
    public BookResponse complete(Long id, LocalDate endDate, Long currentUserId) {
        Book book = findBookOrThrow(id);
        requireOwner(book, currentUserId);
        book.complete(endDate);
        auditLogger.event("BOOK_COMPLETED", currentUserId, "bookId=" + id + ", endDate=" + endDate);
        return BookResponse.from(book);
    }

    @Transactional
    public void delete(Long id, Long currentUserId) {
        Book book = findBookOrThrow(id);
        requireOwner(book, currentUserId);
        bookRepository.delete(book);
        auditLogger.event("BOOK_DELETED", currentUserId, "bookId=" + id);
    }

    private Book findBookOrThrow(Long id) {
        return bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.NOT_FOUND, "책 기록을 찾을 수 없습니다. id=" + id));
    }

    // 본인 소유의 책 기록만 수정/완독/삭제할 수 있도록 강제한다. 조회(getById/search)는
    // 공유 앱 특성상 계속 열어둔다 — 여기서 막는 건 쓰기(수정/완독/삭제) 작업뿐이다.
    private void requireOwner(Book book, Long currentUserId) {
        if (!book.getUser().getId().equals(currentUserId)) {
            throw new ForbiddenException(ErrorCode.NOT_OWNER, "본인 책 기록만 수정/삭제할 수 있습니다.");
        }
    }
}
