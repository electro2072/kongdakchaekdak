import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Svg, {Circle} from 'react-native-svg';
import type {GenreRatioDto} from '../../types/dashboard';
import {useTheme} from '../../theme';

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
 * Frame 05.1 장르 비율 도넛차트 — 디자인 확인 완료 규칙(claude/독서기록앱_프론트요청_디자인시스템v2동기화_v1.md 답변):
 * - genreRatios는 백엔드가 count 내림차순으로 이미 정렬해서 준다(장르 종류가 아니라 "그 사용자의 순위"로 색이 정해짐)
 * - 1위→chart1, 2위→chart2, 3위→chart3, 4위 이하는 전부 합산해 "기타" 1개 슬라이스(색: chart4가 아니라 n200)
 * - genreRatios가 3개 이하면 "기타" 슬라이스 자체를 만들지 않음
 * - 완독 0권(genreRatios: [])이면 빈 회색 링만 보여준다
 */
export function GenreDonutChart({genreRatios}: GenreDonutChartProps) {
  const {colors, typography} = useTheme();

  const top3 = genreRatios.slice(0, 3);
  const rest = genreRatios.slice(3);
  const restRatio = rest.reduce((sum, genre) => sum + genre.ratio, 0);

  const rankColors = [colors.chart1, colors.chart2, colors.chart3];
  const slices: Slice[] = top3.map((genre, index) => ({
    label: genre.genre,
    ratio: genre.ratio,
    color: rankColors[index],
  }));
  if (rest.length > 0) {
    slices.push({label: '기타', ratio: restRatio, color: colors.n200});
  }

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
          <Text style={[typography.caption, {color: colors.n500}]}>
            아직 완독한 책이 없어요
          </Text>
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
