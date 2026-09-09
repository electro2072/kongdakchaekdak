import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import type {MonthlyTrendDto} from '../../types/api/dashboard';
import {useTheme} from '../../theme';
import {t} from '../../strings';

interface MonthlyTrendChartProps {
  monthlyTrend: MonthlyTrendDto[];
}

const CHART_HEIGHT = 72;
const MIN_BAR_HEIGHT = 4;

function formatMonthLabel(yearMonth: string): string {
  const [, month] = yearMonth.split('-');
  return t('dashboard.monthLabel', {month: Number(month)});
}

/**
 * Frame 05.1 월별 완독 추이 막대그래프 — 디자인 확인 완료 규칙:
 * - monthlyTrend 배열 길이만큼 동적으로 렌더링한다(백엔드는 항상 6개를 주지만 하드코딩하지 않음)
 * - 가장 값이 큰 막대 1개만 p700(강조), 나머지는 전부 p100
 * - 값이 전부 0인 특수 케이스(방금 가입 등)는 전부 p100으로 처리
 */
export function MonthlyTrendChart({monthlyTrend}: MonthlyTrendChartProps) {
  const {colors, typography} = useTheme();

  const maxCount = Math.max(
    0,
    ...monthlyTrend.map(month => month.completedCount),
  );
  const peakIndex =
    maxCount > 0
      ? monthlyTrend.findIndex(month => month.completedCount === maxCount)
      : -1;

  return (
    <View style={styles.row}>
      {monthlyTrend.map((month, index) => {
        const barHeight =
          maxCount > 0
            ? Math.max(
                (month.completedCount / maxCount) * CHART_HEIGHT,
                MIN_BAR_HEIGHT,
              )
            : MIN_BAR_HEIGHT;
        const isPeak = index === peakIndex;
        return (
          <View key={month.yearMonth} style={styles.barColumn}>
            <Text
              style={[typography.caption, {color: colors.n600, fontSize: 10}]}>
              {month.completedCount}
            </Text>
            <View
              style={[
                styles.bar,
                {
                  height: barHeight,
                  backgroundColor: isPeak ? colors.p700 : colors.p100,
                },
              ]}
            />
            <Text
              style={[typography.caption, {color: colors.n500, fontSize: 10}]}>
              {formatMonthLabel(month.yearMonth)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  barColumn: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  bar: {
    width: 18,
    borderRadius: 4,
  },
});
