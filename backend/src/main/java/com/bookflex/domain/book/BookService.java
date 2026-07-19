package com.bookflex.domain.book;

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
    public BookResponse create(BookCreateRequest request) {
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
    public BookResponse update(Long id, BookUpdateRequest request) {
        Book book = findBookOrThrow(id);
        book.update(request.title(), request.author(), request.coverImage(),
                request.isbn(), request.genre(), request.totalPages());
        return BookResponse.from(book);
    }

    @Transactional
    public BookResponse complete(Long id, LocalDate endDate) {
        Book book = findBookOrThrow(id);
        book.complete(endDate);
        return BookResponse.from(book);
    }

    @Transactional
    public void delete(Long id) {
        Book book = findBookOrThrow(id);
        bookRepository.delete(book);
    }

    private Book findBookOrThrow(Long id) {
        return bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("책 기록을 찾을 수 없습니다. id=" + id));
    }
}
