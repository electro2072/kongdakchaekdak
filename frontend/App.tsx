/**
 * 콩닥책닥
 * React Navigation 골격: 로그인(mock) → 하단 탭(일정/서재/공유/프로필, 각 화면은 아직 placeholder).
 * 화면설계서: docs/독서기록공유앱_화면설계서_wireframe_v2-5.html
 */

import React from 'react';
import {StatusBar} from 'react-native';
import {enableScreens} from 'react-native-screens';
import Config from 'react-native-config';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {AuthProvider} from './src/navigation/AuthContext';
import {ProfileProvider} from './src/navigation/ProfileContext';
import {LibraryProvider} from './src/navigation/LibraryContext';
import {ToastProvider} from './src/components/Toast';
import {RootNavigator} from './src/navigation/RootNavigator';
import {initializeNaverLogin} from './src/services/socialAuth/naverAuth';
import {useTheme} from './src/theme';

enableScreens();

// 소셜 로그인 SDK 초기화 — 앱 시작 시 한 번만. 카카오는 네이티브 앱 키를
// strings.xml/Info.plist에서 자동으로 읽어서 별도 JS 초기화가 필요 없음.
// (docs/test/requests/소셜로그인_App초기화_리그레션_수정요청_v1.md 반영 — 2026-09-01 복구)
GoogleSignin.configure({
  webClientId: Config.GOOGLE_WEB_CLIENT_ID,
  iosClientId: Config.GOOGLE_IOS_CLIENT_ID,
});
initializeNaverLogin();

function App(): React.JSX.Element {
  const {isDark, colors} = useTheme();

  return (
    <AuthProvider>
      <ProfileProvider>
        <LibraryProvider>
          <ToastProvider>
            <StatusBar
              barStyle={isDark ? 'light-content' : 'dark-content'}
              backgroundColor={colors.surface}
            />
            <RootNavigator />
          </ToastProvider>
        </LibraryProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}

export default App;
