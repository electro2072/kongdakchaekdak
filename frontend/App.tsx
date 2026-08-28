/**
 * 콩닥책닥
 * React Navigation 골격: 로그인(mock) → 하단 탭(일정/서재/공유/프로필, 각 화면은 아직 placeholder).
 * 화면설계서: docs/독서기록공유앱_화면설계서_wireframe_v2-5.html
 */

import React from 'react';
import {StatusBar} from 'react-native';
import {enableScreens} from 'react-native-screens';
import {AuthProvider} from './src/navigation/AuthContext';
import {ProfileProvider} from './src/navigation/ProfileContext';
import {RootNavigator} from './src/navigation/RootNavigator';
import {useTheme} from './src/theme';

enableScreens();

function App(): React.JSX.Element {
  const {isDark, colors} = useTheme();

  return (
    <AuthProvider>
      <ProfileProvider>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={colors.surface}
        />
        <RootNavigator />
      </ProfileProvider>
    </AuthProvider>
  );
}

export default App;
