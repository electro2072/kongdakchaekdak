package com.bookflex.domain.user;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;

/**
 * 닉네임 미입력 시 자동 배정하는 랜덤 닉네임 생성기 (예: "책벌레1234").
 * User CRUD(UserService), 이메일/PW 가입(AuthService), 소셜 로그인 최초 가입(SocialAuthService)
 * 세 곳에서 공통으로 사용해서 로직이 흩어지지 않게 한다.
 */
@Component
public class RandomNicknameGenerator {

    private static final String[] PREFIXES = {"책벌레", "독서가", "이야기꾼", "페이지터너"};
    private static final SecureRandom RANDOM = new SecureRandom();

    public String generate() {
        String prefix = PREFIXES[RANDOM.nextInt(PREFIXES.length)];
        int suffix = 1000 + RANDOM.nextInt(9000);
        return prefix + suffix;
    }
}
