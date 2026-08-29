import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";

/**
 * v16 기준 GoogleSignin.signIn()은 취소를 throw가 아니라 `{ type: 'cancelled' }` 형태의
 * 정상 반환값으로 알려준다(isSuccessResponse(response) === false). 이 심볼을 반환해서
 * 호출부가 "에러 얼럿을 띄울 필요 없는 취소"임을 구분할 수 있게 한다.
 * 참고: https://react-native-google-signin.github.io/docs/original
 */
export const GOOGLE_SIGN_IN_CANCELLED = Symbol("GOOGLE_SIGN_IN_CANCELLED");

/**
 * 구글 로그인 실행 후 백엔드(POST /api/auth/google)에 보낼 idToken을 반환한다.
 * GoogleSignin.configure()는 App.tsx에서 앱 시작 시 한 번만 호출되어 있어야 한다.
 */
export async function signInWithGoogle(): Promise<
  string | typeof GOOGLE_SIGN_IN_CANCELLED
> {
  await GoogleSignin.hasPlayServices();
  const response = await GoogleSignin.signIn();

  if (!isSuccessResponse(response)) {
    return GOOGLE_SIGN_IN_CANCELLED;
  }

  const {idToken} = response.data;
  if (!idToken) {
    throw new Error("구글 로그인 응답에 idToken이 없습니다.");
  }
  return idToken;
}

/** GoogleSignin 관련 에러인지(재시도 중, Play Services 없음 등) 판별할 때 사용 */
export function isGoogleSignInError(error: unknown) {
  return isErrorWithCode(error);
}

export {statusCodes as googleSignInStatusCodes};
