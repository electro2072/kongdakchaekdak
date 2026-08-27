import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme} from '../theme';

interface ProfileStatCardProps {
  label: string;
  value: number;
}

/** Frame 05/05.1 공용 통계 카드 — design/hifi_mockup_v1.html `.card`, 숫자는 typography.stat + p700 */
export function ProfileStatCard({label, value}: ProfileStatCardProps) {
  const {colors, typography, radii} = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.hairline,
          borderRadius: radii.card,
        },
      ]}>
      <Text style={[typography.stat, {color: colors.p700}]}>{value}</Text>
      <Text style={[typography.caption, {color: colors.n600, marginTop: 4}]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
});
