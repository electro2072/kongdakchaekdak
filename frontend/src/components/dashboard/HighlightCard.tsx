import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import type {DashboardHighlights} from '../../types/dashboard';
import {useTheme} from '../../theme';

interface HighlightCardProps {
  highlights: DashboardHighlights;
  recommendedCaption: string;
}

/**
 * Frame 05.1 하이라이트 카드 — design/hifi_mockup_v1.html `.card-accent`,
 * ✨/📖 이모지 + 문구 구성. 완독 0권이면 highlights 전부 null이라 문구 없이
 * recommendedCaption(격려 문구)만 보여준다.
 */
export function HighlightCard({highlights, recommendedCaption}: HighlightCardProps) {
  const {colors, typography, radii} = useTheme();

  const rows: Array<{emoji: string; text: string}> = [];
  if (highlights.topGenre) {
    rows.push({
      emoji: '✨',
      text: `이 기간 가장 많이 읽은 장르는 '${highlights.topGenre}'예요`,
    });
  }
  if (highlights.longestReadBook) {
    rows.push({
      emoji: '📖',
      text: `가장 오래 읽은 책은 «${highlights.longestReadBook.title}»(${highlights.longestReadBook.days}일)이에요`,
    });
  }
  if (highlights.fastestReadBook) {
    rows.push({
      emoji: '⚡',
      text: `가장 빠르게 읽은 책은 «${highlights.fastestReadBook.title}»(${highlights.fastestReadBook.days}일)이에요`,
    });
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.p50,
          borderColor: colors.hairline,
          borderRadius: radii.card,
        },
      ]}>
      {rows.map((row, index) => (
        <Text
          key={index}
          style={[
            typography.caption,
            {color: colors.n700, marginBottom: 6},
          ]}>
          {row.emoji} {row.text}
        </Text>
      ))}
      <Text
        style={[
          typography.caption,
          {color: colors.n600, marginBottom: 0},
        ]}>
        {recommendedCaption}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: 14,
  },
});
