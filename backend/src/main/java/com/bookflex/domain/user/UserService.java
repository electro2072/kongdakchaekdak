package com.bookflex.domain.user;

import com.bookflex.common.exception.ForbiddenException;
import com.bookflex.common.exception.ResourceNotFoundException;
import com.bookflex.common.logging.AuditLogger;
import com.bookflex.domain.user.dto.UserCreateRequest;
import com.bookflex.domain.user.dto.UserResponse;
import com.bookflex.domain.user.dto.UserUpdateRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

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

    public UserResponse getById(Long id) {
        return UserResponse.from(findUserOrThrow(id));
    }

    public List<UserResponse> getAll() {
        return userRepository.findAll().stream()
                .map(UserResponse::from)
                .toList();
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

    // 본인 계정만 수정/삭제할 수 있도록 강제한다. 다른 회원의 프로필 조회(getById/getAll)는
    // 공유 앱 특성상 계속 열어둔다 — 여기서 막는 건 쓰기(수정/삭제) 작업뿐이다.
    private void requireOwner(Long targetUserId, Long currentUserId) {
        if (!targetUserId.equals(currentUserId)) {
            throw new ForbiddenException("본인 계정만 수정/삭제할 수 있습니다.");
        }
    }

    private User findUserOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다. id=" + id));
    }
}
