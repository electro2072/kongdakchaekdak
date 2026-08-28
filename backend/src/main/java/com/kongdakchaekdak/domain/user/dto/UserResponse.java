package com.kongdakchaekdak.domain.user.dto;

import com.kongdakchaekdak.domain.common.Genre;
import com.kongdakchaekdak.domain.user.Gender;
import com.kongdakchaekdak.domain.user.User;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;
import java.util.Set;

@Schema(description = "회원 조회 응답")
public record UserResponse(
        Long id,
        String nickname,
        String profileImage,
        String bio,
        Gender gender,
        String socialProvider,
        Set<Genre> interests,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getNickname(),
                user.getProfileImage(),
                user.getBio(),
                user.getGender(),
                user.getSocialProvider(),
                user.getInterests(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}
