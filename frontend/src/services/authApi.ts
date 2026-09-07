import Config from "react-native-config";
import {logger} from "../utils/logger";

/**
 * 백엔드 API 서버 주소. .env의 API_BASE_URL을 우선 쓰고, 없으면 안드로이드 에뮬레이터 기준
 * 기본값(10.0.2.2 = 에뮬레이터에서 본 호스트 PC의 localhost)으로 fallback한다.
 * 실기기(같은 Wi-Fi)로 테스트할 땐 PC의 LAN IP(예: http://192.168.0.5:8080)를 .env에
 * API_BASE_URL로 직접 넣어야 하고, iOS 시뮬레이터는 http://localhost:8080 그대로 써도 된다.
 */
const API_BASE_URL = Config.API_BASE_URL ?? "http://10.0.2.2:8080";

export type SocialProvider = "kakao" | "google" | "naver";

/**
 * claude/독서기록앱_백엔드요청_프론트_인증API변경_v1.md 2번 항목(백엔드 확정 스펙) 기준.
 * accessToken/tokenType은 실제 코드로 확정됐고, 세 번째 필드(만료시간)는 존재는 확인됐으나
 * 정확한 필드명이 미확정이라 expiresIn으로 추정만 해둔 상태 — 값이 와도 파싱 실패하지 않도록
 * optional로 둔다.
 *
 * isNewUser는 claude/독서기록앱_프론트요청_백엔드_인증API_신규회원판별_v1.md 요청에 대한 백엔드
 * 확정 답변 기준(2026-08-29) — 방금 소셜 로그인으로 신규 계정이 생성됐으면 true, 이미 있던 계정으로
 * 로그인한 거면 false. LoginScreen이 이 값으로 회원가입 화면 이동 여부를 분기한다.
 */
export interface TokenResponse {
  accessToken: string;
  tokenType: string;
  isNewUser: boolean;
  expiresIn?: number;
}

const SOCIAL_LOGIN_PATH: Record<SocialProvider, string> = {
  kakao: "/api/auth/kakao",
  google: "/api/auth/google",
  naver: "/api/auth/naver",
};

/** 카카오/네이버는 accessToken, 구글은 idToken을 요청 바디에 담아 보내야 한다 (백엔드 확정 스펙). */
const SOCIAL_LOGIN_BODY_KEY: Record<SocialProvider, "accessToken" | "idToken"> = {
  kakao: "accessToken",
  google: "idToken",
  naver: "accessToken",
};

/**
 * 소셜 로그인 provider 토큰(카카오/네이버 accessToken, 구글 idToken)을 백엔드에 보내
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
