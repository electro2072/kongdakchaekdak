import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {User, BarChart3, ChevronRight, LogOut} from 'lucide-react-native';
import type {MainStackParamList} from '../navigation/types';
import {useAuth} from '../navigation/AuthContext';
import {ProfileStatCard} from '../components/ProfileStatCard';
import {MOCK_PROFILE} from '../mocks/profile';
import {useTheme} from '../theme';

/**
 * Frame 05 · 프로필 탭 — design/hifi_mockup_v1.html 기준
 * (claude/독서기록앱_프론트요청_디자인시스템v2동기화_v1.md 답변의 실제 마크업 반영).
 *
 * 이번 범위 제외(설계 문서 10장): 프로필 편집 화면(Frame 05.2) — 아직 없어서 "프로필 편집"
 * 버튼은 배치만 하고 onPress를 연결하지 않는다. "로그아웃"/"독서 대시보드" 진입은 기존
 * AuthContext/신규 DashboardScreen이 이미 있어서 실제로 연결한다.
 */
export function ProfileScreen() {
  const {colors, typography, radii} = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const {logout} = useAuth();

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.surface}]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={[styles.avatar, {backgroundColor: colors.p50}]}>
            <User size={28} color={colors.p400} />
          </View>
          <Text style={[typography.h2, {color: colors.n900, marginTop: 10}]}>
            {MOCK_PROFILE.nickname}
          </Text>
          <Text style={[typography.caption, {color: colors.n600, marginTop: 4}]}>
            {MOCK_PROFILE.bio}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.outlineButton,
            {borderColor: colors.hairline, borderRadius: radii.md},
          ]}>
          <Text style={[typography.button, {color: colors.n700}]}>
            프로필 편집
          </Text>
        </TouchableOpacity>

        <View style={styles.statRow}>
          <ProfileStatCard label="읽은 책" value={MOCK_PROFILE.booksReadCount} />
          <ProfileStatCard
            label="공유한 기록"
            value={MOCK_PROFILE.sharedRecordsCount}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.dashboardCard,
            {
              backgroundColor: colors.p50,
              borderColor: colors.hairline,
              borderRadius: radii.card,
            },
          ]}
          onPress={() => navigation.navigate('Dashboard')}>
          <View style={styles.dashboardCardLeft}>
            <BarChart3 size={20} color={colors.p700} />
            <Text style={[typography.bodyStrong, {color: colors.n900}]}>
              이번 분기 리캡 보기
            </Text>
          </View>
          <ChevronRight size={18} color={colors.n500} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.outlineButton,
            {borderColor: colors.hairline, borderRadius: radii.md},
          ]}
          onPress={logout}>
          <LogOut size={15} color={colors.n700} />
          <Text style={[typography.button, {color: colors.n700}]}>로그아웃</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 14,
  },
  header: {
    alignItems: 'center',
    marginBottom: 4,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButton: {
    height: 44,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  statRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dashboardCard: {
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dashboardCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
