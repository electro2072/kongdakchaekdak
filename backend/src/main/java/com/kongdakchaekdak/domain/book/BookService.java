package com.kongdakchaekdak.domain.book;

import com.kongdakchaekdak.common.exception.ErrorCode;
import com.kongdakchaekdak.common.exception.ForbiddenException;
import com.kongdakchaekdak.common.exception.InvalidRequestException;
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

    // (G20, 2026-09-10) userId는 항상 BookController가 인증된 currentUserId를 넘겨준다 —
    // 클라이언트가 보낸 파라미터가 아니므로 null이 될 수 없다. 예전엔 userId가 없으면
    // findAll()로 빠져 전 회원 서재가 그대로 유출됐다(BUG-20260910-25) — 그 분기를 제거한다.
    public List<BookResponse> search(Long userId, BookStatus status) {
        List<Book> books = status != null
                ? bookRepository.findByUserIdAndStatus(userId, status)
                : bookRepository.findByUserId(userId);
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

        // (OBS-26, 2026-09-10) endDate 생략 시 기본값(KstClock.today())은 Book.complete()가
        // KST 기준으로 고정해 계산하지만, 클라이언트가 endDate를 직접 명시한 경우까지 막지는
        // 못한다 — startDate보다 이른 endDate가 그대로 저장되는 입력값 자체는 별도로 막는다.
        if (book.getEndDate().isBefore(book.getStartDate())) {
            throw new InvalidRequestException(ErrorCode.INVALID_DATE_RANGE,
                    "완독일이 시작일보다 이릅니다. bookId=" + id + ", startDate=" + book.getStartDate()
                            + ", endDate=" + book.getEndDate());
        }

        auditLogger.event("BOOK_COMPLETED", currentUserId, "bookId=" + id + ", endDate=" + book.getEndDate());
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
