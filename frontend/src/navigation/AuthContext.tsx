import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {logger} from '../utils/logger';
import {
  ApiError,
  registerUnauthorizedHandler,
  setApiAccessToken,
} from '../services/apiClient';
import {
  SECURE_KEY_ACCESS_TOKEN,
  secureStorage,
} from '../services/secureStorage';
import {deleteUser, getMe, type UserResponse} from '../services/userApi';
import {unlinkSocialAccount} from '../services/socialAuth/unlinkSocialAccount';
import type {SocialProvider} from '../types/api/auth';
import {t} from '../strings';

interface AuthContextValue {
  isLoggedIn: boolean;
  /**
   * true인 동안은 저장된 세션을 복원·검증하는 중이다 — RootNavigator가 이 값이 true인 동안은
   * 로그인/메인 화면 대신 최소 로딩 화면을 보여줘야, 복원 전 잠깐 로그인 화면이 깜빡였다
   * 메인으로 넘어가는 게 보이지 않는다.
   */
  isRestoring: boolean;
  /** 소셜 로그인으로 백엔드에서 발급받은 앱 자체 accessToken. 로그인 전(또는 복원 중)엔 null. */
  accessToken: string | null;
  /**
   * 부팅 시 세션 검증(GET /api/auth/me)이 성공했을 때의 응답. 없으면 null
   * (이번 실행에서 방금 로그인했거나, 오프라인 복원인 경우).
   * ProfileProvider가 이 값을 초기 시드로 써서 부팅 직후 /api/auth/me를 두 번 치지 않게 한다.
   */
  sessionUser: UserResponse | null;
  /**
   * 소셜 로그인(LoginScreen)이 백엔드 토큰 교환에 성공한 직후 호출한다. 이 시점엔 아직
   * 회원가입(추가 정보 입력) 화면으로 이동만 하고 isLoggedIn은 바꾸지 않는다.
   * 저장소에도 함께 기록해 세션을 영속화한다.
   */
  setAccessToken: (token: string) => void;
  /**
   * 실제로 로그인 상태로 전환한다(하단 탭 진입). 기존 계정으로 소셜 로그인 완료 시
   * (LoginScreen)와 신규 가입 완료 시(SignupScreen "시작하기")에 호출 — 둘 다 인자 없이
   * 호출하며, 두 경우 모두 accessToken은 이미 setAccessToken으로 저장돼 있다.
   * (2026-09-09: "비회원으로 둘러보기" 폐기 — accessToken 없이 login()이 호출되는 경로는
   * 이제 없다. `claude/독서기록앱_프론트백엔드요청_Apple로그인추가_비회원모드폐기_v1.md` 참고.)
   */
  login: () => void;
  logout: () => void;
  /**
   * 회원 탈퇴(G16/S8) — `DELETE /api/users/{id}`(#10).
   *
   * 순서: ① 서버 탈퇴 → ② 소셜 연결 해제(best-effort, 최대 3초) → ③ 저장된 토큰 삭제 →
   * ④ 로그인 상태 해제(RootNavigator가 AuthStack으로 바꿔 스택이 통째로 리셋되고,
   * Profile/LibraryContext가 isLoggedIn=false에 반응해 캐시를 비운다).
   *
   * ①이 실패하면 ApiError(에러코드 매핑된 message)를 그대로 던지고 **토큰·상태는 건드리지 않는다.**
   * 단 401은 apiClient의 unauthorizedHandler가 이미 로그아웃시킨다(토큰이 죽었으니 유지할 의미가 없다).
   * ②는 절대 reject하지 않으므로 탈퇴 성공을 뒤집지 못한다. 완료 토스트는 호출부(ProfileScreen)가 띄운다.
   */
  withdraw: (params: {
    userId: number;
    socialProvider: SocialProvider | null;
  }) => Promise<void>;
  /**
   * 신규 가입 온보딩 다이얼로그("가입을 환영해요! 지금 바로 서재에 책을 꽂아보시겠어요?")에서
   * "네"를 선택했을 때 true로 설정 — MainStack(정확히는 MainTabs)이 처음 마운트되자마자
   * BookSearch 모달을 자동으로 열기 위한 1회성 신호. true로 세팅한 즉시 login()을 호출해야
   * 하고, 소비하는 쪽(MainTabs)이 읽자마자 다시 false로 되돌려야 한다 — 그래야 다음에
   * 로그아웃 후 재로그인했을 때 의도치 않게 또 열리지 않는다.
   */
  pendingBookSearchOnEntry: boolean;
  setPendingBookSearchOnEntry: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * 인증 상태.
 *
 * 세션 영속화(연동매트릭스 §2.1 #5 / 릴리스 게이트 G3): accessToken을 secureStorage에 저장해
 * 앱을 껐다 켜도 로그인 상태를 유지한다.
 *
 * 부팅 시엔 저장된 토큰을 그대로 믿지 않고 GET /api/auth/me로 한 번 검증한다. 백엔드에
 * 리프레시 토큰이 없어서 만료·무효화된 토큰은 실제로 호출해봐야만 알 수 있기 때문이다.
 * 검증하지 않으면 "메인 화면에 들어갔다가 첫 API 호출에서 튕겨나가는" 흐름이 된다.
 *
 * 실패를 두 가지로 나눠 다룬다:
 *  - 401(토큰이 죽음)  → 저장된 토큰 폐기 + 로그인 화면으로. apiClient의 unauthorizedHandler에
 *    등록해둔 logout()이 먼저 돌기도 하지만, 여기서도 한 번 더 정리해 순서에 의존하지 않는다.
 *  - 네트워크 오류(ApiError.status === 0) → 토큰을 지우지 않고 그대로 로그인 상태로 들여보낸다.
 *    서버가 잠깐 죽었거나 지하철 안이라는 이유로 사용자를 로그아웃시키면 안 된다. 토큰이 실제로
 *    죽었다면 이후 첫 API 호출의 401에서 정리된다.
 */
export function AuthProvider({children}: {children: React.ReactNode}) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [sessionUser, setSessionUser] = useState<UserResponse | null>(null);
  const [pendingBookSearchOnEntry, setPendingBookSearchOnEntry] =
    useState(false);

  /** 메모리 쪽 세션 상태만 되돌린다 — 저장소 삭제는 logout/withdraw가 각자 방식으로 한다. */
  const resetSessionState = useCallback(() => {
    setAccessTokenState(null);
    setApiAccessToken(null);
    setSessionUser(null);
    setIsLoggedIn(false);
    setPendingBookSearchOnEntry(false);
  }, []);

  const logout = useCallback(() => {
    logger.info('AuthContext', '로그아웃');
    resetSessionState();
    secureStorage
      .removeItem(SECURE_KEY_ACCESS_TOKEN)
      .catch(error => logger.warn('AuthContext', '토큰 삭제 실패', {error}));
  }, [resetSessionState]);

  const withdraw = useCallback<AuthContextValue['withdraw']>(
    async ({userId, socialProvider}) => {
      logger.info('AuthContext', '회원 탈퇴 요청', {userId});
      // 실패하면 여기서 던진다 — 아래 정리 단계로 내려가지 않으므로 토큰이 유지된다.
      await deleteUser(userId);

      // 서버 탈퇴가 끝난 뒤에 연결을 끊는다. 먼저 끊었다가 서버 탈퇴가 실패하면
      // "계정은 남았는데 소셜 연결만 끊긴" 상태가 되기 때문이다. 우리 JWT가 필요 없는 호출이라
      // 세션 정리 전에 끝내 두어, 사용자가 곧바로 같은 계정으로 다시 로그인할 때 뒤늦게 도착한
      // 연결 해제가 새 로그인의 SDK 토큰을 지우는 경합도 피한다.
      await unlinkSocialAccount(socialProvider);

      // 로그아웃과 달리 저장소 삭제를 기다린 뒤 상태를 푼다 — 탈퇴한 계정의 토큰이 남은 채
      // 로그인 화면이 먼저 뜨지 않게. 삭제가 실패해도 계정은 이미 없어서, 다음 부팅의
      // /api/auth/me 검증이 실패하며 토큰이 폐기된다(restoreSession 참고).
      try {
        await secureStorage.removeItem(SECURE_KEY_ACCESS_TOKEN);
      } catch (error) {
        logger.warn('AuthContext', '탈퇴 후 토큰 삭제 실패', {error});
      }
      logger.info('AuthContext', '회원 탈퇴 완료 — 세션 정리');
      resetSessionState();
    },
    [resetSessionState],
  );

  // 401 응답을 받으면 apiClient가 이 logout을 호출하도록 등록해둔다.
  useEffect(() => {
    registerUnauthorizedHandler(logout);
    return () => registerUnauthorizedHandler(null);
  }, [logout]);

  // 앱 시작 시 1회 — 저장된 토큰을 복원하고 GET /api/auth/me로 아직 살아 있는지 확인한다.
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      let saved: string | null = null;
      try {
        saved = await secureStorage.getItem(SECURE_KEY_ACCESS_TOKEN);
      } catch (error) {
        logger.warn('AuthContext', '저장된 세션을 읽지 못함', {error});
      }
      if (cancelled) {
        return;
      }
      if (!saved) {
        setIsRestoring(false);
        return;
      }

      // 검증 요청 자체가 Authorization 헤더를 달고 나가야 하므로 먼저 apiClient에 주입한다.
      setApiAccessToken(saved);
      try {
        const user = await getMe();
        if (cancelled) {
          return;
        }
        logger.info('AuthContext', '저장된 세션 복원 완료');
        setAccessTokenState(saved);
        setSessionUser(user);
        setIsLoggedIn(true);
      } catch (error) {
        if (cancelled) {
          return;
        }
        const isNetworkError = error instanceof ApiError && error.status === 0;
        if (isNetworkError) {
          // 서버에 닿지 못한 것뿐이다 — 토큰은 살아 있을 수 있으니 세션을 유지한다.
          logger.warn('AuthContext', '세션 검증 실패(네트워크) — 세션 유지', {
            error,
          });
          setAccessTokenState(saved);
          setIsLoggedIn(true);
        } else {
          logger.warn('AuthContext', '세션이 만료됨 — 저장된 토큰 폐기', {
            error,
          });
          setApiAccessToken(null);
          setAccessTokenState(null);
          setIsLoggedIn(false);
          try {
            await secureStorage.removeItem(SECURE_KEY_ACCESS_TOKEN);
          } catch (e) {
            logger.warn('AuthContext', '토큰 삭제 실패', {error: e});
          }
        }
      } finally {
        if (!cancelled) {
          setIsRestoring(false);
        }
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoggedIn,
      isRestoring,
      accessToken,
      sessionUser,
      setAccessToken: (token: string) => {
        setAccessTokenState(token);
        setApiAccessToken(token);
        secureStorage
          .setItem(SECURE_KEY_ACCESS_TOKEN, token)
          .catch(error =>
            logger.warn('AuthContext', '토큰 저장 실패', {error}),
          );
      },
      login: () => {
        logger.info('AuthContext', '로그인 완료 처리 (isLoggedIn=true)');
        setIsLoggedIn(true);
      },
      logout,
      withdraw,
      pendingBookSearchOnEntry,
      setPendingBookSearchOnEntry,
    }),
    [
      isLoggedIn,
      isRestoring,
      accessToken,
      sessionUser,
      pendingBookSearchOnEntry,
      logout,
      withdraw,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error(t('developer.authOutsideProvider'));
  }
  return context;
}
