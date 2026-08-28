package com.kongdakchaekdak.domain.book;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * 테이블정의서에는 status 컬럼 값이 소문자 'reading'/'done'으로 정의되어 있어서,
 * Java enum(BookStatus.READING/DONE)과 DB 문자열 표현을 이 컨버터로 맞춰준다.
 */
@Converter(autoApply = true)
public class BookStatusConverter implements AttributeConverter<BookStatus, String> {

    @Override
    public String convertToDatabaseColumn(BookStatus attribute) {
        return attribute == null ? null : attribute.name().toLowerCase();
    }

    @Override
    public BookStatus convertToEntityAttribute(String dbData) {
        return dbData == null ? null : BookStatus.valueOf(dbData.toUpperCase());
    }
}
