package com.kongdakchaekdak.domain.user.dto;

import com.kongdakchaekdak.domain.common.Genre;
import com.kongdakchaekdak.domain.user.Gender;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;

import java.util.Set;

@Schema(description = "회원 생성 요청 (Step 3 소셜 로그인 붙기 전, CRUD 검증용 임시 스펙)")
public record UserCreateRequest(

        @Schema(description = "닉네임 (비워두면 랜덤 닉네임 자동 부여)", example = "책벌레")
        @Size(max = 30, message = "닉네임은 최대 30자까지 입력할 수 있습니다.")
        String nickname,

        @Schema(description = "프로필 이미지 URL")
        @Size(max = 255, message = "프로필 이미지 URL이 너무 깁니다.")
        String profileImage,

        @Schema(description = "한줄 소개")
        @Size(max = 100, message = "한줄 소개는 최대 100자까지 입력할 수 있습니다.")
        String bio,

        @Schema(description = "성별 (미입력 시 NONE)")
        Gender gender,

        @Schema(description = "소셜 로그인 제공자 (Step 3 이전에는 임시로 비워둘 수 있음)", example = "kakao")
        @Size(max = 20)
        String socialProvider,

        @Schema(description = "소셜 로그인 고유 ID (Step 3 이전에는 임시로 비워둘 수 있음)")
        @Size(max = 100)
        String socialId,

        @Schema(description = "관심분야 (Frame 01.1 다중선택, 미입력 시 빈 목록)")
        Set<Genre> interests
) {
}
