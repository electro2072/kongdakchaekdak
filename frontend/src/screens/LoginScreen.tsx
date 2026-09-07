import React, {useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AuthStackParamList} from '../navigation/types';
import {useAuth} from '../navigation/AuthContext';
import {useProfile} from '../navigation/ProfileContext';
import {useTheme} from '../theme';
import {useToast} from '../components/Toast';
import {logger} from '../utils/logger';
import {socialLogin} from '../services/authApi';
import {
  GOOGLE_SIGN_IN_CANCELLED,
  signInWithGoogle,
} from '../services/socialAuth/googleAuth';
import {signInWithKakao} from '../services/socialAuth/kakaoAuth';
import {signInWithNaver} from '../services/socialAuth/naverAuth';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

type SocialProviderKey = 'naver' | 'kakao' | 'google';

/**
 * Frame 01 · 로그인 / 온보딩 (Hi-Fi 목업 v1.7/v1.8 기준: design/hifi_mockup_v1.html)
 * 소셜 로그인 버튼은 기획서 3-5 순서(네이버 → 카카오 → 구글) 그대로 노출한다.
 *
 * 41번 항목(2026-08-29)부터 실제 SDK 연동됨 — 각 버튼은 (1) 해당 플랫폼 SDK로 로그인해
 * provider 토큰(카카오/네이버는 accessToken, 구글은 idToken)을 받고, (2) 그 토큰을
 * POST /api/auth/{provider}로 백엔드에 보내 앱 자체 accessToken으로 교환한 뒤,
 * (3) AuthContext에 저장한다. 42·43번 항목(2026-08-29)에서 백엔드가 응답에 isNewUser(boolean)
 * 필드를 추가해주기로 확정하면서, 이제 여기서 신규/기존 사용자를 분기한다 — 신규 계정이면 회원가입
 * (추가 정보 입력) 화면으로 이동하고, 기존 계정이면 화면 이동 없이 바로 로그인 완료 처리(하단 탭
 * 진입)한다. 자세한 배경은 claude/독서기록앱_프론트요청_백엔드_인증API_신규회원판별_v1.md 참고.
 *
 * 카카오는 v6.0.4 공식 문서에 취소 전용 에러 코드가 없어 취소도 일반 실패와 동일하게
 * 처리된다(services/socialAuth/kakaoAuth.ts 주석 참고) — 실기기 테스트로 실제 취소 시
 * 메시지 패턴이 확인되면 조용히 무시하도록 개선할 수 있다.
 *
 * 테스터 리포트 FINDING-20260828-07: 앱 이름이 "콩닥책닥"으로 확정(v1.6)되고 앱 아이콘도
 * "콩닥/책닥" 워드마크 배지(v1.7)로 교체됐는데, 이 화면은 그 이전(v1.3 시절) 임시 문구
 * "독서 자랑" + BookOpen 아이콘이 그대로 남아있었음 — 앱의 첫 화면이라 우선 반영.
 * 로고 배지는 스플래시 화면(design/splash_screen.html)과 동일하게 라이트/다크 상관없이
 * 고정된 브랜드 색(쑥송편 그린 #7D8F5D 배경 + 크림 #f7f1e4 텍스트)을 쓴다 — 이미지 에셋
 * (design/assets/icon/*)을 아직 네이티브 프로젝트에 반영하기 전이라, 우선 같은 배색의
 * 텍스트 배지로 구현하고 실제 아이콘 반영 시 이미지로 교체한다.
 */
export function LoginScreen({navigation}: Props) {
  const {login, setAccessToken} = useAuth();
  const {profile} = useProfile();
  const {colors, typography, radii} = useTheme();
  const {showToast} = useToast();
  const [loadingProvider, setLoadingProvider] =
    useState<SocialProviderKey | null>(null);

  /**
   * 신규 계정이면 회원가입(추가 정보 입력) 화면으로, 기존 계정이면 화면 이동 없이 바로
   * 로그인 완료 처리한다. accessToken은 두 경우 모두 먼저 저장해둔다 — SignupScreen의
   * "시작하기"가 호출하는 login()은 인자가 없고, 이미 저장된 accessToken을 그대로 쓴다.
   *
   * 신규 계정 쪽은 여기서 별도 "환영" 토스트를 띄우지 않는다 — SignupScreen "시작하기"를
   * 누르면 뜨는 "가입을 환영해요!" 온보딩 다이얼로그가 이미 그 역할을 하기 때문에, 로그인
   * 완료 토스트까지 겹치면 환영 메시지가 두 번 뜨는 셈이라 일부러 뺐다
   * (claude/독서기록앱_프론트_토스트알림_프론트로거_설계_v1.md 6장 참고).
   *
   * 기존 계정 쪽은 아직 로그인 응답에 실제 닉네임이 없어서(ProfileContext가 여전히
   * mock-first) 임시로 ProfileContext의 mock 닉네임을 쓴다 — 실제 로그인 응답에 사용자
   * 정보가 포함되도록 백엔드 계약이 확장되면 그 값으로 교체할 것.
   */
  const completeSocialLogin = (accessToken: string, isNewUser: boolean) => {
    setAccessToken(accessToken);
    if (isNewUser) {
      navigation.navigate('Signup');
    } else {
      login();
      showToast({type: 'success', message: `${profile.nickname}님, 환영해요!`});
    }
  };

  const handleSocialLoginError = (label: string, error: unknown) => {
    logger.error('LoginScreen', `소셜 로그인 실패 (${label})`, error);
    Alert.alert('로그인 실패', '잠시 후 다시 시도해주세요.');
  };

  const handleNaverLogin = async () => {
    setLoadingProvider('naver');
    try {
      const naverToken = await signInWithNaver();
      if (naverToken === null) {
        return; // 사용자 취소 — 얼럿 없이 조용히 종료
      }
      const {accessToken, isNewUser} = await socialLogin('naver', naverToken);
      completeSocialLogin(accessToken, isNewUser);
    } catch (error) {
      handleSocialLoginError('네이버', error);
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleKakaoLogin = async () => {
    setLoadingProvider('kakao');
    try {
      const kakaoToken = await signInWithKakao();
      const {accessToken, isNewUser} = await socialLogin('kakao', kakaoToken);
      completeSocialLogin(accessToken, isNewUser);
    } catch (error) {
      handleSocialLoginError('카카오', error);
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleGoogleLogin = async () => {
    setLoadingProvider('google');
    try {
      const idToken = await signInWithGoogle();
      if (idToken === GOOGLE_SIGN_IN_CANCELLED) {
        return; // 사용자 취소 — 얼럿 없이 조용히 종료
      }
      const {accessToken, isNewUser} = await socialLogin('google', idToken);
      completeSocialLogin(accessToken, isNewUser);
    } catch (error) {
      handleSocialLoginError('구글', error);
    } finally {
      setLoadingProvider(null);
    }
  };

  const isBusy = loadingProvider !== null;

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.surface}]}>
      <View style={styles.spacer} />

      <View style={styles.logoBlock}>
        <View style={[styles.logo, {borderRadius: 18}]}>
          <Text style={styles.logoLine}>콩닥</Text>
          <Text style={styles.logoLine}>책닥</Text>
        </View>
        <Text style={[typography.h2, {fontWeight: '800', color: colors.n900}]}>
          콩닥책닥
        </Text>
        <Text style={[typography.caption, {color: colors.n600, marginTop: 6}]}>
          오늘 읽은 한 페이지를 자랑해보세요
        </Text>
      </View>

      <View style={styles.spacer} />

      <View style={styles.buttons}>
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: colors.n100,
              borderColor: 'transparent',
              borderRadius: radii.md,
            },
            isBusy && styles.buttonDisabled,
          ]}
          disabled={isBusy}
          onPress={handleNaverLogin}>
          {loadingProvider === 'naver' ? (
            <ActivityIndicator color={colors.n700} />
          ) : (
            <Text style={[typography.button, {color: colors.n700}]}>
              네이버로 시작하기
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: colors.n100,
              borderColor: 'transparent',
              borderRadius: radii.md,
            },
            isBusy && styles.buttonDisabled,
          ]}
          disabled={isBusy}
          onPress={handleKakaoLogin}>
          {loadingProvider === 'kakao' ? (
            <ActivityIndicator color={colors.n700} />
          ) : (
            <Text style={[typography.button, {color: colors.n700}]}>
              카카오로 시작하기
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: colors.surface,
              borderColor: colors.hairline,
              borderRadius: radii.md,
            },
            isBusy && styles.buttonDisabled,
          ]}
          disabled={isBusy}
          onPress={handleGoogleLogin}>
          {loadingProvider === 'google' ? (
            <ActivityIndicator color={colors.n700} />
          ) : (
            <Text style={[typography.button, {color: colors.n700}]}>
              Google로 시작하기
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.guestLink}
        onPress={() => {
          login();
          showToast({type: 'success', message: '둘러보기를 시작할게요!'});
        }}
        disabled={isBusy}>
        <Text
          style={[
            typography.caption,
            {color: colors.n500, textDecorationLine: 'underline'},
          ]}>
          비회원으로 둘러보기
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  spacer: {
    flex: 0.9,
  },
  logoBlock: {
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    // 스플래시 화면(design/splash_screen.html)과 동일한 고정 브랜드 배색 — 쑥송편 그린.
    // 테마(라이트/다크)와 무관하게 항상 같은 값을 쓴다.
    backgroundColor: '#7D8F5D',
  },
  logoLine: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 15,
    color: '#f7f1e4',
    textAlign: 'center',
  },
  buttons: {
    gap: 10,
    marginBottom: 22,
  },
  button: {
    height: 44,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  guestLink: {
    alignItems: 'center',
    paddingBottom: 24,
  },
});
