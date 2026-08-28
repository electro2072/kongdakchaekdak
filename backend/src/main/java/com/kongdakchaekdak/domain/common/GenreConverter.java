package com.kongdakchaekdak.domain.common;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * {@link Genre}를 DB 컬럼에 한글 라벨 그대로 저장/복원한다(enum 이름이 아님) — 기존
 * {@code BookStatusConverter}와 동일한 패턴. {@code autoApply = false}로 두고 필요한
 * 필드에만 {@code @Convert(converter = GenreConverter.class)}로 명시 적용한다(모든 String
 * 컬럼에 자동 적용되면 안 되므로).
 */
@Converter(autoApply = false)
public class GenreConverter implements AttributeConverter<Genre, String> {

    @Override
    public String convertToDatabaseColumn(Genre genre) {
        return genre == null ? null : genre.getLabel();
    }

    @Override
    public Genre convertToEntityAttribute(String dbValue) {
        return Genre.fromLabelOrNull(dbValue).orElse(null);
    }
}
