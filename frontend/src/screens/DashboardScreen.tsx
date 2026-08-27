import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {Download, Share2} from 'lucide-react-native';
import {useDashboard} from '../hooks/useDashboard';
import {PeriodToggle} from '../components/dashboard/PeriodToggle';
import {GenreDonutChart} from '../components/dashboard/GenreDonutChart';
import {MonthlyTrendChart} from '../components/dashboard/MonthlyTrendChart';
import {HighlightCard} from '../components/dashboard/HighlightCard';
import {ProfileStatCard} from '../components/ProfileStatCard';
import {LoadingSkeleton} from '../components/LoadingSkeleton';
import {NetworkError} from '../components/NetworkError';
import {useTheme} from '../theme';

/**
 * Frame 05.1 · 독서 대시보드(Recap) — design/hifi_mockup_v1.html 기준
 * (claude/독서기록앱_프론트요청_디자인시스템v2동기화_v1.md 답변의 실제 마크업 반영).
 * GET /api/dashboard 연동 전이라 mock 데이터(hooks/useDashboard)를 쓴다 — 계약이 확정돼 있어
 * 실제 연동 시 훅 내부 fetch만 교체하면 이 화면 코드는 그대로 쓸 수 있다.
 *
 * 이번 범위 제외(설계 문서 10장): "이미지 저장"(react-native-view-shot 연동),
 * "공유 탭으로"(Share 탭 이동 연동) — 두 버튼 다 배치만 하고 onPress는 없다.
 */
export function DashboardScreen() {
  const {colors, typography, radii} = useTheme();
  const {period, setPeriod, data, isLoading, error, retry} = useDashboard();

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.surface}]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <PeriodToggle value={period} onChange={setPeriod} />

        {isLoading ? (
          <LoadingSkeleton count={2} />
        ) : error ? (
          <NetworkError message={error} onRetry={retry} />
        ) : data ? (
          <>
            <View style={styles.statRow}>
              <ProfileStatCard label="완독한 책" value={data.completedBookCount} />
              <ProfileStatCard label="읽은 페이지" value={data.totalPagesRead} />
            </View>

            <View style={styles.section}>
              <Text style={[typography.caption, {color: colors.n600}]}>
                장르 비율
              </Text>
              <GenreDonutChart genreRatios={data.genreRatios} />
            </View>

            <View style={styles.section}>
              <Text style={[typography.caption, {color: colors.n600}]}>
                월별 완독 추이
              </Text>
              <MonthlyTrendChart monthlyTrend={data.monthlyTrend} />
            </View>

            <HighlightCard
              highlights={data.highlights}
              recommendedCaption={data.recommendedCaption}
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.outlineButton,
                  {borderColor: colors.hairline, borderRadius: radii.md},
                ]}>
                <Download size={15} color={colors.n700} />
                <Text style={[typography.button, {color: colors.n700}]}>
                  이미지 저장
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  {backgroundColor: colors.accentSolidBg, borderRadius: radii.pill},
                ]}>
                <Share2 size={15} color={colors.onAccentSolid} />
                <Text style={[typography.button, {color: colors.onAccentSolid}]}>
                  공유 탭으로
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}
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
    paddingTop: 16,
    paddingBottom: 24,
    gap: 18,
  },
  statRow: {
    flexDirection: 'row',
    gap: 10,
  },
  section: {
    gap: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  outlineButton: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  primaryButton: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
});
