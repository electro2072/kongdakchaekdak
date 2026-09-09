package com.kongdakchaekdak.domain.book;

import com.kongdakchaekdak.domain.book.dto.BookCompleteRequest;
import com.kongdakchaekdak.domain.book.dto.BookCreateRequest;
import com.kongdakchaekdak.domain.book.dto.BookResponse;
import com.kongdakchaekdak.domain.book.dto.BookUpdateRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 책 기록(일정/서재) CRUD API (Step 2-b). User CRUD(Step 2-a)의 뒤를 이어
 * 등록/조회/수정/완독 처리를 제공한다. Step 3부터 인증(Authorization: Bearer {token})이
 * 필요하다 (SecurityConfig 참고). 단건 조회(getById)는 다른 회원의 책도 볼 수 있게 열려 있지만,
 * 목록 조회(search)는 인증된 본인 서재만 반환한다 — 원래는 클라이언트가 보낸 userId를 그대로
 * 신뢰해 파라미터를 생략하면 전 회원 서재가 덤프되는 문제가 있었다(G20, 2026-09-10 수정).
 * 등록은 본인 명의로만 가능하고 수정/완독/삭제는 본인 소유 책에 대해서만
 * 가능하도록 소유자 검증이 적용되어 있다 (BookService 참고).
 */
@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
@Tag(name = "Book", description = "책 기록(일정/서재) CRUD API")
public class BookController {

    private final BookService bookService;

    @PostMapping
    @Operation(summary = "책 등록 (일정 탭, 본인 명의로만 가능)")
    public ResponseEntity<BookResponse> create(@Valid @RequestBody BookCreateRequest request,
                                                @AuthenticationPrincipal Long currentUserId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bookService.create(request, currentUserId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "책 기록 단건 조회")
    public BookResponse getById(@PathVariable Long id) {
        return bookService.getById(id);
    }

    @GetMapping
    @Operation(summary = "본인 서재 목록 조회 (status로 필터링 가능)")
    public List<BookResponse> search(
            @AuthenticationPrincipal Long currentUserId,
            // API 설계 초안 기준 status=reading/done (소문자) 이라 String으로 받아 대소문자 무관하게 변환한다.
            @RequestParam(required = false) String status
    ) {
        BookStatus bookStatus = status == null ? null : BookStatus.valueOf(status.toUpperCase());
        return bookService.search(currentUserId, bookStatus);
    }

    @PutMapping("/{id}")
    @Operation(summary = "책 기록 수정 (본인 소유만 가능)")
    public BookResponse update(@PathVariable Long id, @Valid @RequestBody BookUpdateRequest request,
                                @AuthenticationPrincipal Long currentUserId) {
        return bookService.update(id, request, currentUserId);
    }

    @PatchMapping("/{id}/complete")
    @Operation(summary = "완독 처리 (endDate 생략 시 오늘 날짜, 본인 소유만 가능)")
    public BookResponse complete(@PathVariable Long id, @RequestBody(required = false) BookCompleteRequest request,
                                  @AuthenticationPrincipal Long currentUserId) {
        var endDate = request == null ? null : request.endDate();
        return bookService.complete(id, endDate, currentUserId);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "책 기록 삭제 (본인 소유만 가능)")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal Long currentUserId) {
        bookService.delete(id, currentUserId);
        return ResponseEntity.noContent().build();
    }
}
