package com.kongdakchaekdak.domain.group.dto;

import com.kongdakchaekdak.domain.group.Group;

import java.time.LocalDateTime;

public record GroupResponse(
        Long id,
        Long ownerId,
        String name,
        long memberCount,
        LocalDateTime createdAt
) {
    public static GroupResponse from(Group group, long memberCount) {
        return new GroupResponse(
                group.getId(),
                group.getOwner().getId(),
                group.getName(),
                memberCount,
                group.getCreatedAt()
        );
    }
}
