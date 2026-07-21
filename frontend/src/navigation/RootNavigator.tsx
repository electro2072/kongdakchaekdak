import React from 'react';
import {
  DefaultTheme,
  DarkTheme,
  NavigationContainer,
} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {useAuth} from './AuthContext';
import {AuthStack} from './AuthStack';
import {MainTabs} from './MainTabs';
import {useTheme} from '../theme';

/** 로그인 상태에 따라 로그인 스택 또는 메인 탭을 보여주는 최상위 내비게이터 */
export function RootNavigator() {
  const {isLoggedIn} = useAuth();
  const {colors, isDark} = useTheme();

  const base = isDark ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.p700,
      background: colors.n50,
      card: colors.surface,
      text: colors.n900,
      border: colors.hairline,
    },
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navigationTheme}>
        {isLoggedIn ? <MainTabs /> : <AuthStack />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
