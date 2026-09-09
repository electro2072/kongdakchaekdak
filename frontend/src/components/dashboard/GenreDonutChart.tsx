import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Svg, {Circle} from 'react-native-svg';
import type {GenreRatioDto} from '../../types/api/dashboard';
import {useTheme} from '../../theme';
import {t} from '../../strings';
import {GENRE_CHART_COLOR_KEY} from '../../constants/genreColors';
import type {Genre} from '../../constants/profileOptions';

interface GenreDonutChartProps {
  genreRatios: GenreRatioDto[];
}

interface Slice {
  label: string;
  ratio: number;
  color: string;
}

const SIZE = 58;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Frame 05.1 장르 비율 도넛차트 — "장르별 고정" 매핑 규칙(claude/독서기록앱_프론트요청_디자인_6개장르고정색전환_v1.md,
 * 2026-08-28에 등수 기반 가이드를 뒤집음):
 * - 순위가 아니라 **장르 이름**이 항상 같은 색을 갖는다 (GENRE_CHART_COLOR_KEY, theme의 chart1~6 참조)
 * - 6개 장르가 닫힌 열거형(백엔드 Genre.java에 자유 텍스트/"기타" 없음)이라 "기타"/회색(n200) 처리는 불필요 —
 *   다만 예상 밖 문자열이 들어와도 화면이 깨지지 않도록 n200 폴백만 방어적으로 남겨둔다
 * - genreRatios는 백엔드가 count 내림차순으로 이미 정렬해서 주므로, 그 순서를 그대로 범례 순서로 쓴다
 *   (색은 더 이상 이 순서에 좌우되지 않는다)
 * - 완독 0권(genreRatios: [])이면 빈 회색 링만 보여준다
 */
export function GenreDonutChart({genreRatios}: GenreDonutChartProps) {
  const {colors, typography} = useTheme();

  const slices: Slice[] = genreRatios.map(genre => {
    const colorKey = GENRE_CHART_COLOR_KEY[genre.genre as Genre];
    return {
      label: genre.genre,
      ratio: genre.ratio,
      color: colorKey ? colors[colorKey] : colors.n200,
    };
  });

  let offsetAccumulator = 0;

  return (
    <View style={styles.row}>
      <Svg width={SIZE} height={SIZE}>
        {slices.length === 0 ? (
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={colors.n200}
            strokeWidth={STROKE}
            fill="none"
          />
        ) : (
          slices.map((slice, index) => {
            const sliceLength = (slice.ratio / 100) * CIRCUMFERENCE;
            const dashArray = `${sliceLength} ${CIRCUMFERENCE - sliceLength}`;
            const dashOffset = -((offsetAccumulator / 100) * CIRCUMFERENCE);
            offsetAccumulator += slice.ratio;
            return (
              <Circle
                key={`${slice.label}-${index}`}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                stroke={slice.color}
                strokeWidth={STROKE}
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                strokeLinecap="butt"
                fill="none"
                // conic-gradient(마크업 기준)는 12시 방향에서 시작하는데 SVG 원의 0도는 3시 방향이라
                // -90도 회전해서 맞춘다.
                rotation={-90}
                origin={`${SIZE / 2}, ${SIZE / 2}`}
              />
            );
          })
        )}
      </Svg>
      <View style={styles.legend}>
        {slices.length === 0 ? (
          <View>
            <Text style={[typography.bodyStrong, {color: colors.n700}]}>
              {t('dashboard.emptyTitle')}
            </Text>
            <Text
              style={[typography.caption, {color: colors.n500, marginTop: 4}]}>
              {t('dashboard.emptyDescription')}
            </Text>
          </View>
        ) : (
          slices.map((slice, index) => (
            <View key={`${slice.label}-${index}`} style={styles.legendRow}>
              <View style={[styles.dot, {backgroundColor: slice.color}]} />
              <Text style={[typography.caption, {color: colors.n700}]}>
                {slice.label}
              </Text>
              <Text style={[typography.caption, {color: colors.n500}]}>
                {Math.round(slice.ratio)}%
              </Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  legend: {
    flex: 1,
    gap: 6,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
});
