import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import type {
  DashboardHighlights,
  DashboardPeriod,
} from '../../types/api/dashboard';
import {useTheme} from '../../theme';
import {t} from '../../strings';
import {josa} from '../../utils/josa';

interface HighlightCardProps {
  highlights: DashboardHighlights;
  period: DashboardPeriod;
  recommendedCaption: string;
}

/** 하이라이트 문장 안에서 기간을 가리키는 말 — 토글 라벨(월간/분기/연간)과 다르다 */
const PERIOD_PHRASE_KEY = {
  month: 'dashboard.periodPhraseMonth',
  quarter: 'dashboard.periodPhraseQuarter',
  year: 'dashboard.periodPhraseYear',
} as const;

/**
 * Frame 05.1 하이라이트 카드 — design/hifi_mockup_v1.html `.card-accent`,
 * ✨/📖 이모지 + 문구 구성. 완독 0권이면 highlights 전부 null이라 문구 없이
 * recommendedCaption(격려 문구)만 보여준다.
 *
 * 문구는 콩닥책닥_보이스확장_밥상레이어.md §4 리캡 표 기준으로,
 * 분기·연 단위로만 보는 화면이라 맛을 가장 진하게 낸 자리다(선 1).
 * 책 제목·장르 뒤 조사는 utils/josa.ts가 받침을 보고 골라준다(§6).
 */
export function HighlightCard({
  highlights,
  period,
  recommendedCaption,
}: HighlightCardProps) {
  const {colors, typography, radii} = useTheme();
  const periodPhrase = t(PERIOD_PHRASE_KEY[period]);

  const rows: Array<{emoji: string; text: string}> = [];

  if (highlights.topGenre) {
    rows.push({
      emoji: '✨',
      text: t('dashboard.highlightTopGenre', {
        period: periodPhrase,
        genre: highlights.topGenre,
        josa: josa(highlights.topGenre, '이었어요/였어요'),
      }),
    });
  }
  if (highlights.longestReadBook) {
    rows.push({
      emoji: '📖',
      text: t('dashboard.highlightLongestRead', {
        title: highlights.longestReadBook.title,
        josa: josa(highlights.longestReadBook.title, '을/를'),
        days: highlights.longestReadBook.days,
      }),
    });
  }
  if (highlights.fastestReadBook) {
    rows.push({
      emoji: '⚡',
      text: t('dashboard.highlightFastestRead', {
        title: highlights.fastestReadBook.title,
        josa: josa(highlights.fastestReadBook.title, '은/는'),
        days: highlights.fastestReadBook.days,
      }),
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
          style={[typography.caption, {color: colors.n700, marginBottom: 6}]}>
          {row.emoji} {row.text}
        </Text>
      ))}
      <Text style={[typography.caption, {color: colors.n600, marginBottom: 0}]}>
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
