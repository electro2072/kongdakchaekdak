package com.kongdakchaekdak.domain.user;

import com.kongdakchaekdak.common.exception.ErrorCode;
import com.kongdakchaekdak.common.exception.ForbiddenException;
import com.kongdakchaekdak.common.exception.ResourceNotFoundException;
import com.kongdakchaekdak.common.logging.AuditLogger;
import com.kongdakchaekdak.domain.user.dto.UserCreateRequest;
import com.kongdakchaekdak.domain.user.dto.UserResponse;
import com.kongdakchaekdak.domain.user.dto.UserUpdateRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final RandomNicknameGenerator randomNicknameGenerator;
    private final AuditLogger auditLogger;

    @Transactional
    public UserResponse create(UserCreateRequest request) {
        String nickname = (request.nickname() == null || request.nickname().isBlank())
                ? randomNicknameGenerator.generate()
                : request.nickname();

        User user = new User(
                nickname,
                request.profileImage(),
                request.bio(),
                request.gender(),
                request.socialProvider(),
                request.socialId()
        );
        user.updateInterests(request.interests());

        User saved = userRepository.save(user);
        auditLogger.event("USER_CREATED", saved.getId(), null);
        return UserResponse.from(saved);
    }

    // (G20 확장, 2026-09-10) 본인 계정만 조회 가능하도록 requireOwner를 재사용한다.
    // 예전엔 인증만 되어 있으면 누구든 타인 id로 조회할 수 있었다 — BookController의
    // G20(서재 목록 소유자 검증 누락)과 같은 패턴의 결함. getAll()(전체 회원 명부 조회)은
    // 프론트 호출부가 없어 삭제했다(추후 그룹 기능에서 타인 프로필 조회가 필요해지면 별도로 열 것).
    public UserResponse getById(Long id, Long currentUserId) {
        requireOwner(id, currentUserId);
        return UserResponse.from(findUserOrThrow(id));
    }

    @Transactional
    public UserResponse update(Long id, UserUpdateRequest request, Long currentUserId) {
        requireOwner(id, currentUserId);
        User user = findUserOrThrow(id);
        user.updateProfile(request.nickname(), request.profileImage(), request.bio(), request.gender());
        user.updateInterests(request.interests());
        return UserResponse.from(user);
    }

    @Transactional
    public void delete(Long id, Long currentUserId) {
        requireOwner(id, currentUserId);
        User user = findUserOrThrow(id);
        userRepository.delete(user);
        auditLogger.event("USER_DELETED", currentUserId, "targetUserId=" + id);
    }

    // 본인 계정만 조회/수정/삭제할 수 있도록 강제한다(G20 확장, 2026-09-10 — 원래는
    // 조회(getById)까지는 열어뒀었다).
    private void requireOwner(Long targetUserId, Long currentUserId) {
        if (!targetUserId.equals(currentUserId)) {
            throw new ForbiddenException(ErrorCode.NOT_OWNER, "본인 계정만 조회/수정/삭제할 수 있습니다.");
        }
    }

    private User findUserOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.NOT_FOUND, "사용자를 찾을 수 없습니다. id=" + id));
    }
}
