import React, {useRef, useState} from 'react';
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
import {useProfile} from '../navigation/ProfileContext';
import {ProfileStatCard} from '../components/ProfileStatCard';
import {ConfirmDialog} from '../components/ConfirmDialog';
import {useToast} from '../components/Toast';
import {useTheme} from '../theme';
import {t} from '../strings';

/**
 * Frame 05 · 프로필 탭 — design/hifi_mockup_v1.html 기준
 * (claude/독서기록앱_프론트요청_디자인시스템v2동기화_v1.md 답변의 실제 마크업 반영).
 *
 * 닉네임/한줄소개는 ProfileContext(GET /api/auth/me)에서 가져온다 — "프로필 편집" 화면
 * (Frame 05.2)에서 PATCH /api/users/{id}로 저장하면 여기 바로 반영된다.
 * "읽은 책 / 공유한 기록" 카운트는 백엔드에 집계 필드가 없어 FE가 계산한다(연동매트릭스 §2.2 ②) —
 * 아직 못 불러왔을 땐 0이 아니라 '–'로 둔다.
 * "로그아웃"/"독서 대시보드" 진입은 기존 AuthContext/DashboardScreen과 실제로 연결한다.
 *
 * 주요 인터랙션 요소에 testID를 달아뒀다 — __tests__/ProfileScreen.test.tsx 참고.
 *
 * 회원 탈퇴(G16/S8) — Frame 05.5·05.6(v1.21). 별도 설정 화면 없이 로그아웃 아래 텍스트 링크로
 * 진입해 확인 다이얼로그 1회 → `AuthContext.withdraw` → 로그인 화면 + 완료 토스트.
 * 흐름(서버 탈퇴·연결 해제·세션 정리 순서)은 AuthContext.withdraw 주석 참고.
 * 진입 경로·모임장 위임 안내는 `ACCOUNT_DELETION.md`·`TERMS.md` 11조(`d8319c6`)와 일치시켜 뒀다.
 */
export function ProfileScreen() {
  const {colors, typography, radii} = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const {logout, withdraw} = useAuth();
  const {profile, isStatsLoading, userId, socialProvider} = useProfile();
  const {showToast} = useToast();
  const [isWithdrawDialogVisible, setIsWithdrawDialogVisible] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  // 중복 탭 방지는 state가 아니라 ref로 한다 — "탈퇴"를 빠르게 두 번 누르면 두 번째 onPress가
  // state 갱신(리렌더) 전에 들어오므로, 동기적으로 읽히는 값이어야 DELETE가 한 번만 나간다.
  const isWithdrawingRef = useRef(false);

  const handleConfirmWithdraw = async () => {
    if (isWithdrawingRef.current) {
      return;
    }
    setIsWithdrawDialogVisible(false);
    if (userId === null) {
      // /api/auth/me를 아직 못 받았다 — 누구를 탈퇴시킬지 모르므로 요청하지 않는다.
      showToast({
        type: 'error',
        message: t('failure.profile'),
        aboveTabBar: true,
      });
      return;
    }

    isWithdrawingRef.current = true;
    setIsWithdrawing(true);
    try {
      await withdraw({userId, socialProvider});
      // 성공하면 RootNavigator가 AuthStack으로 바뀌며 이 화면은 이미 사라졌다.
      // 토스트는 화면 밖(ToastProvider)에 떠서 로그인 화면 위에 보인다 — Frame 05.6.
      // 사라진 화면의 state는 되돌리지 않는다.
      showToast({type: 'success', message: t('profile.withdraw.success')});
    } catch (e) {
      // 실패 시 토큰·로그인 상태는 AuthContext가 그대로 둔다. 문구는 apiClient의 에러코드 매핑
      // (API_ERROR_MESSAGE_KEY)을 거친 ApiError.message를 그대로 쓴다.
      isWithdrawingRef.current = false;
      setIsWithdrawing(false);
      showToast({
        type: 'error',
        message: e instanceof Error ? e.message : t('apiError.unknown'),
        aboveTabBar: true,
      });
    }
  };

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
            {profile.nickname}
          </Text>
          {profile.bio ? (
            <Text
              style={[typography.caption, {color: colors.n600, marginTop: 4}]}>
              {profile.bio}
            </Text>
          ) : null}
        </View>

        <TouchableOpacity
          testID="edit-profile-button"
          style={[
            styles.outlineButton,
            {borderColor: colors.hairline, borderRadius: radii.md},
          ]}
          onPress={() => navigation.navigate('ProfileEdit')}>
          <Text style={[typography.button, {color: colors.n700}]}>
            {t('profile.editButton')}
          </Text>
        </TouchableOpacity>

        <View style={styles.statRow}>
          <ProfileStatCard
            label={t('profile.booksRead')}
            value={
              isStatsLoading
                ? t('profile.statPlaceholder')
                : profile.booksReadCount
            }
          />
          <ProfileStatCard
            label={t('profile.sharedRecords')}
            value={
              isStatsLoading
                ? t('profile.statPlaceholder')
                : profile.sharedRecordsCount
            }
          />
        </View>

        <TouchableOpacity
          testID="dashboard-card"
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
              {t('profile.recapCard')}
            </Text>
          </View>
          <ChevronRight size={18} color={colors.n500} />
        </TouchableOpacity>

        <TouchableOpacity
          testID="logout-button"
          style={[
            styles.outlineButton,
            {borderColor: colors.hairline, borderRadius: radii.md},
          ]}
          onPress={logout}>
          <LogOut size={15} color={colors.n700} />
          <Text style={[typography.button, {color: colors.n700}]}>
            {t('profile.logout')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="withdraw-link"
          accessibilityRole="button"
          accessibilityState={{disabled: isWithdrawing, busy: isWithdrawing}}
          disabled={isWithdrawing}
          hitSlop={12}
          style={styles.withdrawLink}
          onPress={() => setIsWithdrawDialogVisible(true)}>
          <Text
            style={[
              typography.caption,
              styles.withdrawLinkText,
              {color: colors.error},
            ]}>
            {t('profile.withdraw.link')}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <ConfirmDialog
        visible={isWithdrawDialogVisible}
        title={t('profile.withdraw.dialogTitle')}
        message={`${t('profile.withdraw.dialogDeleteNotice')}\n${t(
          'profile.withdraw.dialogGroupNotice',
        )}`}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('profile.withdraw.confirm')}
        danger
        onCancel={() => setIsWithdrawDialogVisible(false)}
        onConfirm={handleConfirmWithdraw}
      />
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
  // Frame 05.5 — 로그아웃 버튼보다 한 단계 작은 가운데 정렬 밑줄 링크(--error). 간격은 content gap(14)과 같다.
  withdrawLink: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
  withdrawLinkText: {
    textDecorationLine: 'underline',
  },
});
