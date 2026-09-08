import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {logger} from '../utils/logger';
import {registerUnauthorizedHandler, setApiAccessToken} from '../services/apiClient';

const STORAGE_KEY_ACCESS_TOKEN = '@konggdak/accessToken';

interface AuthContextValue {
  isLoggedIn: boolean;
  /**
   * true인 동안은 AsyncStorage에서 세션 복원을 시도하는 중이다 — RootNavigator가 이 값이
   * true인 동안은 로그인/메인 화면 대신 최소 로딩 화면을 보여줘야, 복원 전 잠깐 로그인
   * 화면이 깜빡였다 메인으로 넘어가는 게 보이지 않는다.
   */
  isRestoring: boolean;
  /** 소셜 로그인으로 백엔드에서 발급받은 앱 자체 accessToken. 게스트 진입 시엔 null. */
  accessToken: string | null;
  /**
   * 소셜 로그인(LoginScreen)이 백엔드 토큰 교환에 성공한 직후 호출한다. 이 시점엔 아직
   * 회원가입(추가 정보 입력) 화면으로 이동만 하고 isLoggedIn은 바꾸지 않는다.
   * AsyncStorage에도 함께 저장해 세션을 영속화한다.
   */
  setAccessToken: (token: string) => void;
  /**
   * 실제로 로그인 상태로 전환한다(하단 탭 진입). SignupScreen "시작하기"와
   * "비회원으로 둘러보기"에서 호출 — 둘 다 인자 없이 호출하며, accessToken은 이미
   * setAccessToken으로 저장돼 있으면 그대로 유지되고 게스트 진입이면 null로 남는다.
   */
  login: () => void;
  logout: () => void;
  /**
   * 신규 가입 온보딩 다이얼로그("가입을 환영해요! 지금 바로 서재에 책을 꽂아보시겠어요?")에서
   * "네"를 선택했을 때 true로 설정 — MainStack(정확히는 MainTabs)이 처음 마운트되자마자
   * BookSearch 모달을 자동으로 열기 위한 1회성 신호. true로 세팅한 즉시 login()을 호출해야
   * 하고, 소비하는 쪽(MainTabs)이 읽자마자 다시 false로 되돌려야 한다 — 그래야 다음에
   * 로그아웃 후 재로그인했을 때 의도치 않게 또 열리지 않는다.
   * (claude/독서기록앱_프론트_토스트알림_프론트로거_설계_v1.md 참고)
   */
  pendingBookSearchOnEntry: boolean;
  setPendingBookSearchOnEntry: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * 인증 상태.
 *
 * 2026-09-08 업데이트: 세션 영속화 도입(claude/독서기록앱_프론트_전체API연동_설계_v1.md 2장) —
 * accessToken을 AsyncStorage에 저장해 앱 재시작 후에도 로그인 상태를 복원한다. 게스트(비회원
 * 둘러보기) 세션은 그대로 미영속 — 저장할 유효한 토큰이 없어서 앱을 재시작하면 다시 로그인
 * 화면부터 시작한다.
 *
 * 백엔드에 리프레시 토큰이 없어(회신 확인 완료) accessToken 만료/무효화는 실제로 인증 API를
 * 호출해 401을 받아봐야만 알 수 있다 — apiClient의 unauthorizedHandler로 이 Provider의
 * logout()을 등록해 401 발생 시 자동으로 로그아웃(재로그인 유도)되게 한다.
 */
export function AuthProvider({children}: {children: React.ReactNode}) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [pendingBookSearchOnEntry, setPendingBookSearchOnEntry] = useState(false);

  const logout = useCallback(() => {
    logger.info('AuthContext', '로그아웃');
    setAccessTokenState(null);
    setApiAccessToken(null);
    setIsLoggedIn(false);
    setPendingBookSearchOnEntry(false);
    AsyncStorage.removeItem(STORAGE_KEY_ACCESS_TOKEN).catch(error =>
      logger.warn('AuthContext', 'AsyncStorage 토큰 삭제 실패', {error}),
    );
  }, []);

  // 401 응답을 받으면 apiClient가 이 logout을 호출하도록 등록해둔다.
  useEffect(() => {
    registerUnauthorizedHandler(logout);
    return () => registerUnauthorizedHandler(null);
  }, [logout]);

  // 앱 시작 시 1회 — AsyncStorage에 저장된 세션이 있으면 복원한다.
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY_ACCESS_TOKEN)
      .then(saved => {
        if (cancelled || !saved) {
          return;
        }
        logger.info('AuthContext', '저장된 세션 복원');
        setAccessTokenState(saved);
        setApiAccessToken(saved);
        setIsLoggedIn(true);
      })
      .catch(error =>
        logger.warn('AuthContext', 'AsyncStorage 세션 복원 실패', {error}),
      )
      .finally(() => {
        if (!cancelled) {
          setIsRestoring(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoggedIn,
      isRestoring,
      accessToken,
      setAccessToken: (token: string) => {
        setAccessTokenState(token);
        setApiAccessToken(token);
        AsyncStorage.setItem(STORAGE_KEY_ACCESS_TOKEN, token).catch(error =>
          logger.warn('AuthContext', 'AsyncStorage 토큰 저장 실패', {error}),
        );
      },
      login: () => {
        logger.info('AuthContext', '로그인 완료 처리 (isLoggedIn=true)');
        setIsLoggedIn(true);
      },
      logout,
      pendingBookSearchOnEntry,
      setPendingBookSearchOnEntry,
    }),
    [isLoggedIn, isRestoring, accessToken, pendingBookSearchOnEntry, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth는 AuthProvider 안에서만 사용할 수 있습니다.');
  }
  return context;
}
