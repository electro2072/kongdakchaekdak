package com.bookflex.domain.user;

import com.bookflex.common.exception.ResourceNotFoundException;
import com.bookflex.domain.user.dto.UserCreateRequest;
import com.bookflex.domain.user.dto.UserResponse;
import com.bookflex.domain.user.dto.UserUpdateRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private static final String[] RANDOM_NICKNAME_PREFIXES = {"책벌레", "독서가", "이야기꾼", "페이지터너"};
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;

    @Transactional
    public UserResponse create(UserCreateRequest request) {
        String nickname = (request.nickname() == null || request.nickname().isBlank())
                ? generateRandomNickname()
                : request.nickname();

        User user = new User(
                nickname,
                request.profileImage(),
                request.bio(),
                request.gender(),
                request.socialProvider(),
                request.socialId()
        );

        return UserResponse.from(userRepository.save(user));
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
    public UserResponse update(Long id, UserUpdateRequest request) {
        User user = findUserOrThrow(id);
        user.updateProfile(request.nickname(), request.profileImage(), request.bio(), request.gender());
        return UserResponse.from(user);
    }

    @Transactional
    public void delete(Long id) {
        User user = findUserOrThrow(id);
        userRepository.delete(user);
    }

    private User findUserOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다. id=" + id));
    }

    private String generateRandomNickname() {
        String prefix = RANDOM_NICKNAME_PREFIXES[RANDOM.nextInt(RANDOM_NICKNAME_PREFIXES.length)];
        int suffix = 1000 + RANDOM.nextInt(9000);
        return prefix + suffix;
    }
}
