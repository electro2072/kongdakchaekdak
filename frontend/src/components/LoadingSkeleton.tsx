import React, {useEffect, useRef} from 'react';
import {View, Animated, StyleSheet} from 'react-native';
import {useTheme} from '../theme';

interface LoadingSkeletonProps {
  /** 표시할 스켈레톤 카드 개수 (기본 3) */
  count?: number;
}

/**
 * 공통 로딩 스켈레톤 (design/hifi_mockup_v1.html Frame 07.1 기준).
 * 서재/검색 목록처럼 "표지 + 텍스트 두 줄" 카드 형태 리스트가 로딩 중일 때 사용한다.
 * Hi-Fi 목업의 shimmer 그라디언트 대신 Animated 투명도 pulse로 가볍게 구현했다
 * (별도 라이브러리 추가 없이 react-native 기본 Animated API만 사용).
 */
export function LoadingSkeleton({count = 3}: LoadingSkeletonProps) {
  const {colors, radii} = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 650,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <View style={styles.list}>
      {Array.from({length: count}).map((_, index) => (
        <Animated.View
          key={index}
          style={[
            styles.card,
            {
              opacity,
              borderColor: colors.hairline,
              borderRadius: radii.card,
            },
          ]}>
          <View style={[styles.cover, {backgroundColor: colors.n200}]} />
          <View style={styles.lines}>
            <View
              style={[
                styles.line,
                {backgroundColor: colors.n200, width: '70%'},
              ]}
            />
            <View
              style={[
                styles.line,
                {backgroundColor: colors.n200, width: '45%'},
              ]}
            />
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 8,
  },
  card: {
    flexDirection: 'row',
    gap: 10,
    borderWidth: 1,
    padding: 10,
  },
  cover: {
    width: 42,
    height: 58,
    borderRadius: 8,
    flexShrink: 0,
  },
  lines: {
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  line: {
    height: 10,
    borderRadius: 4,
  },
});
