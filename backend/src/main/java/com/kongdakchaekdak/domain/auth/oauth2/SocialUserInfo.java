package com.kongdakchaekdak.domain.auth.oauth2;

/**
 * 소셜 로그인 제공자(카카오/구글/네이버)로부터 받아온 사용자 정보를, 우리 서비스가
 * 필요로 하는 최소한의 형태로 정규화한 것. {@code providerUserId}는 해당 제공자 안에서
 * 그 사용자를 유일하게 식별하는 값(카카오 id, 구글 sub, 네이버 id)이고,
 * {@code nicknameHint}는 최초 가입 시 닉네임 기본값으로 쓸 수 있는 값(없으면 null).
 */
public record SocialUserInfo(String providerUserId, String nicknameHint) {
}
