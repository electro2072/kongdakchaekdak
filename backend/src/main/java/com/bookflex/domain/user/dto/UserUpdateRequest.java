package com.bookflex.domain.user.dto;

import com.bookflex.domain.common.Genre;
import com.bookflex.domain.user.Gender;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;

import java.util.Set;

@Schema(description = "회원 프로필 부분 수정 요청 (null 필드는 변경하지 않음)")
public record UserUpdateRequest(

        @Schema(description = "닉네임")
        @Size(max = 30, message = "닉네임은 최대 30자까지 입력할 수 있습니다.")
        String nickname,

        @Schema(description = "프로필 이미지 URL")
        @Size(max = 255, message = "프로필 이미지 URL이 너무 깁니다.")
        String profileImage,

        @Schema(description = "한줄 소개")
        @Size(max = 100, message = "한줄 소개는 최대 100자까지 입력할 수 있습니다.")
        String bio,

        @Schema(description = "성별")
        Gender gender,

        @Schema(description = "관심분야 (Frame 05.2 다중선택 통째 교체 — null이면 변경 없음, 빈 Set이면 전체 해제)")
        Set<Genre> interests
) {
}
