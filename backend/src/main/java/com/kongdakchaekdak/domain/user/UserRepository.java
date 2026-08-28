package com.kongdakchaekdak.domain.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    // 소셜 로그인(카카오/구글/네이버) 시 기존 회원 조회용 (SocialAuthService 참고).
    Optional<User> findBySocialProviderAndSocialId(String socialProvider, String socialId);
}
