package com.bookflex.domain.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    // Step 3: 이메일/PW 로그인 조회용 (socialProvider="local", socialId=이메일).
    Optional<User> findBySocialProviderAndSocialId(String socialProvider, String socialId);
}
