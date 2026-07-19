package com.bookflex.domain.user.dto;

import com.bookflex.domain.user.Gender;
import com.bookflex.domain.user.User;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

@Schema(description = "회원 조회 응답")
public record UserResponse(
        Long id,
        String nickname,
        String profileImage,
        String bio,
        Gender gender,
        String socialProvider,
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
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}
