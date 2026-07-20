package com.bookflex.domain.share;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class ShareScopeConverter implements AttributeConverter<ShareScope, String> {

    @Override
    public String convertToDatabaseColumn(ShareScope attribute) {
        return attribute == null ? null : attribute.name().toLowerCase();
    }

    @Override
    public ShareScope convertToEntityAttribute(String dbData) {
        return dbData == null ? null : ShareScope.valueOf(dbData.toUpperCase());
    }
}
