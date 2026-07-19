package com.bookflex.domain.book;

/** 테이블정의서 Book.status: 'reading'(읽는 중) / 'done'(완독). DB에는 소문자로 저장된다 (BookStatusConverter 참고) */
public enum BookStatus {
    READING,
    DONE
}
