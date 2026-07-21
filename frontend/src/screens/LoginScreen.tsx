import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {BookOpen} from 'lucide-react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AuthStackParamList} from '../navigation/types';
import {useAuth} from '../navigation/AuthContext';
import {useTheme} from '../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

/**
 * Frame 01 · 로그인 / 온보딩 (Hi-Fi 목업 v1.3 기준: design/hifi_mockup_v1.html)
 * 소셜 로그인 버튼은 기획서 3-5 순서(네이버 → 카카오 → 구글) 그대로 노출한다.
 * 실제 OAuth(Step 3)가 아직 없어서, 버튼을 누르면 회원가입 화면으로 이동한다.
 */
export function LoginScreen({navigation}: Props) {
  const {login} = useAuth();
  const {colors, typography, radii} = useTheme();

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.surface}]}>
      <View style={styles.spacer} />

      <View style={styles.logoBlock}>
        <View
          style={[
            styles.logo,
            {backgroundColor: colors.p50, borderRadius: 18},
          ]}>
          <BookOpen size={26} color={colors.p400} />
        </View>
        <Text style={[typography.h2, {fontWeight: '800', color: colors.n900}]}>
          독서 자랑
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
