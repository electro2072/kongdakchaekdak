package com.bookflex.domain.group.dto;

import com.bookflex.domain.group.GroupMember;

import java.time.LocalDateTime;

public record GroupMemberResponse(
        Long userId,
        String nickname,
        LocalDateTime joinedAt
) {
    public static GroupMemberResponse from(GroupMember member) {
        return new GroupMemberResponse(
                member.getUser().getId(),
                member.getUser().getNickname(),
                member.getJoinedAt()
        );
    }
}
