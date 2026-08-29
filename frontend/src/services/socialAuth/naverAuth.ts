import NaverLogin from "@react-native-seoul/naver-login";
import Config from "react-native-config";

/**
 * App.tsx에서 앱 시작 시 한 번만 호출한다 — 매 로그인 시도마다 다시 부를 필요 없음.
 * consumerKey/consumerSecret/serviceUrlSchemeIOS는 .env 값과 iOS Info.plist/AppDelegate.mm의
 * 값이 반드시 일치해야 한다(독서기록앱_개발현황.md 38·40번 항목 참고).
 */
export function initializeNaverLogin() {
  NaverLogin.initialize({
    appName: Config.NAVER_APP_NAME ?? "콩닥책닥",
    consumerKey: Config.NAVER_CONSUMER_KEY ?? "",
    consumerSecret: Config.NAVER_CONSUMER_SECRET ?? "",
    serviceUrlSchemeIOS: Config.NAVER_URL_SCHEME_IOS ?? "",
  });
}

/**
 * 네이버 로그인 실행 후 백엔드(POST /api/auth/naver)에 보낼 accessToken을 반환한다.
 * 사용자가 취소하면 null을 반환한다(에러 아님) — failureResponse.isCancel로 판별.
 * 참고: https://github.com/crossplatformkorea/react-native-naver-login (v5.0.1 기준
 * successResponse의 만료시간 필드는 expiresAt이 아니라 expiresAtUnixSecondString이다).
 */
export async function signInWithNaver(): Promise<string | null> {
  const result = await NaverLogin.login();

  if (result.isSuccess) {
    // 테스터 리포트 FINDING-20260829-13: @react-native-seoul/naver-login v5 타입 정의는
    // isSuccess===true여도 successResponse를 non-optional로 좁혀주지 못한다(라이브러리 타입
    // 한계) — `npm run typecheck`에서 TS18048로 걸림. 명시적으로 널 체크해서 좁혀준다.
    if (!result.successResponse) {
      throw new Error("네이버 로그인 응답에 successResponse가 없습니다.");
    }
    return result.successResponse.accessToken;
  }
  if (result.failureResponse?.isCancel) {
    return null;
  }
  throw new Error(result.failureResponse?.message ?? "네이버 로그인에 실패했습니다.");
}
