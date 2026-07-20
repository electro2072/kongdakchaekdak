package com.bookflex.domain.book;

import com.bookflex.common.exception.ForbiddenException;
import com.bookflex.common.exception.ResourceNotFoundException;
import com.bookflex.domain.book.dto.BookCreateRequest;
import com.bookflex.domain.book.dto.BookResponse;
import com.bookflex.domain.book.dto.BookUpdateRequest;
import com.bookflex.domain.user.User;
import com.bookflex.domain.user.UserRepository;
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

    @Transactional
    public BookResponse create(BookCreateRequest request, Long currentUserId) {
        if (!request.userId().equals(currentUserId)) {
            throw new ForbiddenException("본인 명의로만 책을 등록할 수 있습니다.");
        }

        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다. id=" + request.userId()));

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
        return BookResponse.from(bookRepository.save(book));
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
        return BookResponse.from(book);
    }

    @Transactional
    public void delete(Long id, Long currentUserId) {
        Book book = findBookOrThrow(id);
        requireOwner(book, currentUserId);
        bookRepository.delete(book);
    }

    private Book findBookOrThrow(Long id) {
        return bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("책 기록을 찾을 수 없습니다. id=" + id));
    }

    // 본인 소유의 책 기록만 수정/완독/삭제할 수 있도록 강제한다. 조회(getById/search)는
    // 공유 앱 특성상 계속 열어둔다 — 여기서 막는 건 쓰기(수정/완독/삭제) 작업뿐이다.
    private void requireOwner(Book book, Long currentUserId) {
        if (!book.getUser().getId().equals(currentUserId)) {
            throw new ForbiddenException("본인 책 기록만 수정/삭제할 수 있습니다.");
        }
    }
}
