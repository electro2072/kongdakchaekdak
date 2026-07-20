package com.bookflex.domain.share;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class SharePlatformConverter implements AttributeConverter<SharePlatform, String> {

    @Override
    public String convertToDatabaseColumn(SharePlatform attribute) {
        return attribute == null ? null : attribute.name().toLowerCase();
    }

    @Override
    public SharePlatform convertToEntityAttribute(String dbData) {
        return dbData == null ? null : SharePlatform.valueOf(dbData.toUpperCase());
    }
}
