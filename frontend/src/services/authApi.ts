import Config from "react-native-config";
import {logger} from "../utils/logger";
import type {SocialProvider, TokenResponse} from "../types/api/auth";

export type {SocialProvider, TokenResponse};

/**
 * 백엔드 API 서버 주소. .env의 API_BASE_URL을 우선 쓰고, 없으면 안드로이드 에뮬레이터 기준
 * 기본값(10.0.2.2 = 에뮬레이터에서 본 호스트 PC의 localhost)으로 fallback한다.
 * 실기기(같은 Wi-Fi)로 테스트할 땐 PC의 LAN IP(예: http://192.168.0.5:8080)를 .env에
 * API_BASE_URL로 직접 넣어야 하고, iOS 시뮬레이터는 http://localhost:8080 그대로 써도 된다.
 */
const API_BASE_URL = Config.API_BASE_URL ?? "http://10.0.2.2:8080";

// 2026-09-09: SocialProvider/TokenResponse 타입 정의는 src/types/api/auth.ts로 옮겼다
// ("인터페이스 한 폴더에 모아놓기" 리팩터링). 이 파일은 그 타입을 가져다 쓰기만 한다 —
// 다른 파일들이 기존처럼 `from '../services/authApi'`로 타입을 계속 가져올 수 있도록
// 위에서 re-export도 해 둔다.

const SOCIAL_LOGIN_PATH: Record<SocialProvider, string> = {
  kakao: "/api/auth/kakao",
  google: "/api/auth/google",
  naver: "/api/auth/naver",
  apple: "/api/auth/apple",
};

/**
 * 카카오/네이버는 accessToken, 구글/애플은 idToken을 요청 바디에 담아 보내야 한다
 * (백엔드 확정 스펙 — 애플은 2026-09-09 추가, `claude/독서기록앱_프론트백엔드요청_Apple로그인추가_비회원모드폐기_v1.md`
 * 참고. 애플이 실제로 보내는 값은 identityToken(JWT)이지만 요청 바디 필드명은 구글과 동일하게
 * `idToken`이다 — 백엔드 `AppleIdTokenRequest`가 그렇게 정의돼 있다).
 */
const SOCIAL_LOGIN_BODY_KEY: Record<SocialProvider, "accessToken" | "idToken"> = {
  kakao: "accessToken",
  google: "idToken",
  naver: "accessToken",
  apple: "idToken",
};

/**
 * 소셜 로그인 provider 토큰(카카오/네이버 accessToken, 구글/애플 idToken)을 백엔드에 보내
 * 앱 자체 JWT(TokenResponse)로 교환한다.
 */
export async function socialLogin(
  provider: SocialProvider,
  providerToken: string,
): Promise<TokenResponse> {
  const url = `${API_BASE_URL}${SOCIAL_LOGIN_PATH[provider]}`;
  const bodyKey = SOCIAL_LOGIN_BODY_KEY[provider];

  logger.info("authApi", "소셜 로그인 요청", {provider});
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({[bodyKey]: providerToken}),
    });

    if (!response.ok) {
      throw new Error(`소셜 로그인 API 요청 실패 (${provider}): ${response.status}`);
    }

    const data: TokenResponse = await response.json();
    logger.info("authApi", "소셜 로그인 성공", {provider, isNewUser: data.isNewUser});
    return data;
  } catch (error) {
    logger.error("authApi", "소셜 로그인 실패", {provider, error});
    throw error;
  }
}
