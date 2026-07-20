package com.bookflex.domain.booknote.dto;

import com.bookflex.domain.booknote.BookNote;

import java.time.LocalDateTime;

public record BookNoteResponse(
        Long id,
        Long bookId,
        String content,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static BookNoteResponse from(BookNote note) {
        return new BookNoteResponse(
                note.getId(),
                note.getBook().getId(),
                note.getContent(),
                note.getCreatedAt(),
                note.getUpdatedAt()
        );
    }
}
