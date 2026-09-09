import appleAuth, {
  AppleButton,
} from '@invertase/react-native-apple-authentication';

/**
 * 애플 로그인 관련 얇은 래퍼 — 카카오/구글/네이버(kakaoAuth.ts/googleAuth.ts/naverAuth.ts)와
 * 동일하게, LoginScreen이 이 파일을 통해서만 SDK를 만지도록 한다.
 *
 * claude/독서기록앱_프론트백엔드요청_Apple로그인추가_비회원모드폐기_v1.md 반영(2026-09-09) —
 * iOS 전용, Android는 노출 안 함. App.tsx에서의 별도 초기화(구글 GoogleSignin.configure(),
 * 네이버 initializeNaverLogin() 같은)는 필요 없다 — AuthenticationServices 프레임워크
 * 기반이라 Xcode "Sign in with Apple" capability만 켜져 있으면 된다(별도 안내 필요, 아직
 * Apple 개발자 계정 미등록이라 이번 라운드 범위 밖 — TODO 리스트 참고).
 */

export const APPLE_SIGN_IN_CANCELLED = Symbol('APPLE_SIGN_IN_CANCELLED');

/** LoginScreen이 `Platform.OS === 'ios'`와 함께 확인하는 플랫폼/iOS 버전 지원 여부(13+). */
export const isAppleSignInSupported = appleAuth.isSupported;

/**
 * 애플 로그인 실행 후 백엔드(POST /api/auth/apple, `{ idToken }`)에 그대로 전달할
 * identityToken(JWT)을 반환한다. 사용자가 취소하면(에러 코드 1001) 얼럿 없이 조용히
 * 종료할 수 있도록 심볼을 반환한다(카카오/구글/네이버와 동일한 패턴).
 */
export async function signInWithApple(): Promise<
  string | typeof APPLE_SIGN_IN_CANCELLED
> {
  try {
    const response = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
    });

    if (!response.identityToken) {
      throw new Error('애플 로그인 응답에 identityToken이 없습니다.');
    }
    return response.identityToken;
  } catch (error) {
    if (isAppleSignInCancelled(error)) {
      return APPLE_SIGN_IN_CANCELLED;
    }
    throw error;
  }
}

/** 사용자가 애플 로그인 화면을 취소했을 때(코드 1001, `appleAuth.Error.CANCELED`) 던져지는 에러인지 판별한다. */
function isAppleSignInCancelled(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as {code?: unknown}).code === appleAuth.Error.CANCELED
  );
}

/** 화면(LoginScreen)이 Apple 공식 버튼을 그대로 쓸 수 있도록 재노출 — 직접 스타일링 금지 요청 반영. */
export {AppleButton};
