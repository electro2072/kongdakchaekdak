package com.kongdakchaekdak.domain.bookphoto.dto;

import com.kongdakchaekdak.domain.bookphoto.BookPhoto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record BookPhotoResponse(
        Long id,
        Long bookId,
        String imageUrl,
        String locationText,
        BigDecimal latitude,
        BigDecimal longitude,
        LocalDateTime createdAt
) {
    public static BookPhotoResponse from(BookPhoto photo) {
        return new BookPhotoResponse(
                photo.getId(),
                photo.getBook().getId(),
                photo.getImageUrl(),
                photo.getLocationText(),
                photo.getLatitude(),
                photo.getLongitude(),
                photo.getCreatedAt()
        );
    }
}
