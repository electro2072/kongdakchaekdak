package com.kongdakchaekdak.domain.share;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** BookStatusConverter와 동일한 패턴 — 테이블정의서의 소문자 문자열('book'/'dashboard')과 enum을 맞춰준다. */
@Converter(autoApply = true)
public class ShareTypeConverter implements AttributeConverter<ShareType, String> {

    @Override
    public String convertToDatabaseColumn(ShareType attribute) {
        return attribute == null ? null : attribute.name().toLowerCase();
    }

    @Override
    public ShareType convertToEntityAttribute(String dbData) {
        return dbData == null ? null : ShareType.valueOf(dbData.toUpperCase());
    }
}
