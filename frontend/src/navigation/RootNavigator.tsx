import React from 'react';
import {ActivityIndicator, View} from 'react-native';
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
  const {isLoggedIn, isRestoring} = useAuth();
  const {colors, isDark} = useTheme();

  // 2026-09-08 업데이트: 세션 영속화(AsyncStorage) 복원 중에는 로그인/메인 어느 쪽도 아닌
  // 최소 로딩 화면을 보여준다 — 안 그러면 복원 전 잠깐 로그인 화면이 깜빡였다 메인으로
  // 넘어가는 게 보일 수 있다(claude/독서기록앱_프론트_전체API연동_설계_v1.md 3장).
  if (isRestoring) {
    return (
      <SafeAreaProvider>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.surface,
          }}>
          <ActivityIndicator color={colors.p700} />
        </View>
      </SafeAreaProvider>
    );
  }

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
