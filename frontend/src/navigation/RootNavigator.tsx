import React from 'react';
import {
  DefaultTheme,
  DarkTheme,
  NavigationContainer,
} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {useAuth} from './AuthContext';
import {AuthStack} from './AuthStack';
import {MainStack} from './MainStack';
import {useTheme} from '../theme';

/** 로그인 상태에 따라 로그인 스택 또는 메인 스택(하단 탭 + 책 상세 등)을 보여주는 최상위 내비게이터 */
export function RootNavigator() {
  const {isLoggedIn} = useAuth();
  const {colors, isDark} = useTheme();

  const base = isDark ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.p700,
      // 테스터 리포트 FINDING-20260828-06: 카드(surface)와 구분되는 앱 바탕 전용 토큰이
      // 없어 n50을 대신 쓰고 있었다 — 다크모드에서 design 의도(#181a14)보다 밝게 나오는
      // 원인이었음. 전용 토큰(appBackground)으로 교체.
      background: colors.appBackground,
      card: colors.surface,
      text: colors.n900,
      border: colors.hairline,
    },
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navigationTheme}>
        {isLoggedIn ? <MainStack /> : <AuthStack />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
