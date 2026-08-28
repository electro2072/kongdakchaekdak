import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AuthStackParamList} from '../navigation/types';
import {useAuth} from '../navigation/AuthContext';
import {useTheme} from '../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

/**
 * Frame 01 · 로그인 / 온보딩 (Hi-Fi 목업 v1.7/v1.8 기준: design/hifi_mockup_v1.html)
 * 소셜 로그인 버튼은 기획서 3-5 순서(네이버 → 카카오 → 구글) 그대로 노출한다.
 * 실제 OAuth(Step 3)가 아직 없어서, 버튼을 누르면 회원가입 화면으로 이동한다.
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
  const {login} = useAuth();
  const {colors, typography, radii} = useTheme();

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
          ]}
          onPress={() => navigation.navigate('Signup')}>
          <Text style={[typography.button, {color: colors.n700}]}>
            네이버로 시작하기
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: colors.n100,
              borderColor: 'transparent',
              borderRadius: radii.md,
            },
          ]}
          onPress={() => navigation.navigate('Signup')}>
          <Text style={[typography.button, {color: colors.n700}]}>
            카카오로 시작하기
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: colors.surface,
              borderColor: colors.hairline,
              borderRadius: radii.md,
            },
          ]}
          onPress={() => navigation.navigate('Signup')}>
          <Text style={[typography.button, {color: colors.n700}]}>
            Google로 시작하기
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.guestLink} onPress={login}>
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
  guestLink: {
    alignItems: 'center',
    paddingBottom: 24,
  },
});
