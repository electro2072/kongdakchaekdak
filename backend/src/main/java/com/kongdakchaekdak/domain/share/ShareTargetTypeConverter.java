package com.kongdakchaekdak.domain.share;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class ShareTargetTypeConverter implements AttributeConverter<ShareTargetType, String> {

    @Override
    public String convertToDatabaseColumn(ShareTargetType attribute) {
        return attribute == null ? null : attribute.name().toLowerCase();
    }

    @Override
    public ShareTargetType convertToEntityAttribute(String dbData) {
        return dbData == null ? null : ShareTargetType.valueOf(dbData.toUpperCase());
    }
}
