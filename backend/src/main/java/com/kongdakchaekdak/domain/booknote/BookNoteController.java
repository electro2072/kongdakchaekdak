package com.kongdakchaekdak.domain.booknote;

import com.kongdakchaekdak.domain.booknote.dto.BookNoteCreateRequest;
import com.kongdakchaekdak.domain.booknote.dto.BookNoteResponse;
import com.kongdakchaekdak.domain.booknote.dto.BookNoteUpdateRequest;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** 책에 대한 소감/독서노트(BookNote) API (Step 5). 한 책에 여러 번 작성 가능. */
@RestController
@RequestMapping("/api/books/{bookId}/notes")
@RequiredArgsConstructor
@Tag(name = "BookNote", description = "독서 소감 API")
public class BookNoteController {

    private final BookNoteService bookNoteService;

    @PostMapping
    @Operation(summary = "소감 작성 (본인 소유 책만 가능)")
    public ResponseEntity<BookNoteResponse> create(@PathVariable Long bookId,
                                                     @Valid @RequestBody BookNoteCreateRequest request,
                                                     @AuthenticationPrincipal Long currentUserId) {
        BookNoteResponse response = bookNoteService.create(bookId, request, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Operation(summary = "책의 소감 목록 조회")
    public List<BookNoteResponse> list(@PathVariable Long bookId) {
        return bookNoteService.list(bookId);
    }

    @PatchMapping("/{noteId}")
    @Operation(summary = "소감 수정 (본인 소유 책만 가능)")
    public BookNoteResponse update(@PathVariable Long bookId, @PathVariable Long noteId,
                                    @Valid @RequestBody BookNoteUpdateRequest request,
                                    @AuthenticationPrincipal Long currentUserId) {
        return bookNoteService.update(bookId, noteId, request, currentUserId);
    }

    @DeleteMapping("/{noteId}")
    @Operation(summary = "소감 삭제 (본인 소유 책만 가능)")
    public ResponseEntity<Void> delete(@PathVariable Long bookId, @PathVariable Long noteId,
                                        @AuthenticationPrincipal Long currentUserId) {
        bookNoteService.delete(bookId, noteId, currentUserId);
        return ResponseEntity.noContent().build();
    }
}
