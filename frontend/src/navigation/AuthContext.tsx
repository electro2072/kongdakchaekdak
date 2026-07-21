import React, {createContext, useContext, useMemo, useState} from 'react';

interface AuthContextValue {
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * 임시 mock 인증 상태. 백엔드 소셜 로그인(Step 3)이 아직 없어서, 실제 OAuth 없이
 * login()을 호출하면 바로 로그인된 것으로 취급해 하단 탭으로 진입할 수 있게 한다.
 * 앱을 재시작하면 초기화된다(AsyncStorage 등 영속화 없음).
 *
 * TODO(Step 3): 카카오/구글/네이버 OAuth2 연동 완료 시, login()을 실제 토큰 발급/검증
 * 로직으로 교체하고 필요하면 세션을 영속화한다.
 */
export function AuthProvider({children}: {children: React.ReactNode}) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoggedIn,
      login: () => setIsLoggedIn(true),
      logout: () => setIsLoggedIn(false),
    }),
    [isLoggedIn],
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
