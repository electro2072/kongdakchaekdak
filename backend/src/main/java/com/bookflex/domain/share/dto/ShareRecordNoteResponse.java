package com.bookflex.domain.share.dto;

import com.bookflex.domain.booknote.BookNote;

/** 공유 카드/공개 웹페이지에 노출할 소감(BookNote) 요약. */
public record ShareRecordNoteResponse(Long noteId, String content) {

    public static ShareRecordNoteResponse from(BookNote note) {
        return new ShareRecordNoteResponse(note.getId(), note.getContent());
    }
}
