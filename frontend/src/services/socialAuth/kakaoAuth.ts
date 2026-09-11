import {
  login as kakaoLoginSdk,
  unlink as kakaoUnlinkSdk,
} from "@react-native-seoul/kakao-login";

/**
 * 카카오 로그인 실행 후 백엔드(POST /api/auth/kakao)에 보낼 accessToken을 반환한다.
 * 네이티브 앱 키(strings.xml/Info.plist)는 이미 설정되어 있어 별도 JS 초기화 호출은 필요 없다.
 *
 * 주의: @react-native-seoul/kakao-login v6.0.4 공식 문서(README/타입 정의)에는 "사용자 취소"를
 * 구분하는 전용 에러 코드가 없다 — 취소도 일반 에러와 동일하게 reject된다. 그래서 호출부에서
 * 취소와 실제 실패를 구분하지 못하고 둘 다 동일한 실패 처리를 하게 되는데, 이는 이 라이브러리의
 * 문서화된 한계이지 이 코드의 버그가 아니다. 나중에 실제 기기 테스트로 취소 시 에러 메시지
 * 패턴이 확인되면 여기서 분기 처리를 추가할 수 있다.
 */
export async function signInWithKakao(): Promise<string> {
  const token = await kakaoLoginSdk();
  if (!token?.accessToken) {
    throw new Error("카카오 로그인 응답에 accessToken이 없습니다.");
  }
  return token.accessToken;
}

/**
 * 카카오 연결 끊기(unlink) — 회원 탈퇴(G16) 후 best-effort로 호출한다.
 * SDK가 들고 있는 카카오 토큰으로 요청하므로 우리 서버 JWT와는 무관하다. 실패 처리는 호출부
 * (`unlinkSocialAccount.ts`)가 맡는다 — 여기서는 SDK 에러를 그대로 던진다.
 */
export async function unlinkKakao(): Promise<void> {
  await kakaoUnlinkSdk();
}
