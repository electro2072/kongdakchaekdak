import React, {createContext, useContext, useMemo, useState} from 'react';
import {logger} from '../utils/logger';

interface AuthContextValue {
  isLoggedIn: boolean;
  /** 소셜 로그인으로 백엔드에서 발급받은 앱 자체 accessToken. 게스트 진입 시엔 null. */
  accessToken: string | null;
  /**
   * 소셜 로그인(LoginScreen)이 백엔드 토큰 교환에 성공한 직후 호출한다. 이 시점엔 아직
   * 회원가입(추가 정보 입력) 화면으로 이동만 하고 isLoggedIn은 바꾸지 않는다.
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
 * 인증 상태. isLoggedIn 자체는 여전히 로컬 state일 뿐 영속화되지 않는다(앱 재시작 시 초기화,
 * AsyncStorage 등 미도입) — 다만 accessToken은 40번 항목까지 완료된 실제 소셜 로그인
 * (카카오/구글/네이버 SDK → POST /api/auth/{provider})에서 발급받은 진짜 값이 저장된다.
 * 이후 인증이 필요한 API를 호출할 때 `Authorization: Bearer {accessToken}` 헤더로 써야 한다.
 *
 * TODO: 세션 영속화(AsyncStorage 등)와 accessToken 만료/갱신 처리는 아직 없음 — 앱을
 * 재시작하면 다시 로그인해야 한다.
 */
export function AuthProvider({children}: {children: React.ReactNode}) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [pendingBookSearchOnEntry, setPendingBookSearchOnEntry] = useState(false);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoggedIn,
      accessToken,
      setAccessToken: (token: string) => setAccessTokenState(token),
      login: () => {
        logger.info('AuthContext', '로그인 완료 처리 (isLoggedIn=true)');
        setIsLoggedIn(true);
      },
      logout: () => {
        logger.info('AuthContext', '로그아웃');
        setAccessTokenState(null);
        setIsLoggedIn(false);
        setPendingBookSearchOnEntry(false);
      },
      pendingBookSearchOnEntry,
      setPendingBookSearchOnEntry,
    }),
    [isLoggedIn, accessToken, pendingBookSearchOnEntry],
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
