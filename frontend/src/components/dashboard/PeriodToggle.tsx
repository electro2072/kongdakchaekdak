import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import type {DashboardPeriod} from '../../types/api/dashboard';
import {useTheme} from '../../theme';
import {t, type StringKey} from '../../strings';

interface PeriodToggleProps {
  value: DashboardPeriod;
  onChange: (period: DashboardPeriod) => void;
}

const OPTIONS: Array<{value: DashboardPeriod; labelKey: StringKey}> = [
  {value: 'month', labelKey: 'dashboard.periodMonth'},
  {value: 'quarter', labelKey: 'dashboard.periodQuarter'},
  {value: 'year', labelKey: 'dashboard.periodYear'},
];

/** Frame 05.1 기간 토글 — design/hifi_mockup_v1.html `.chip`/`.chip.selected` 스펙 */
export function PeriodToggle({value, onChange}: PeriodToggleProps) {
  const {colors, typography, radii} = useTheme();

  return (
    <View style={styles.row}>
      {OPTIONS.map(option => {
        const selected = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.chip,
              {
                borderRadius: radii.pill,
                backgroundColor: selected ? colors.accentSolidBg : colors.n100,
              },
            ]}
            onPress={() => onChange(option.value)}>
            <Text
              style={[
                typography.caption,
                {
                  color: selected ? colors.onAccentSolid : colors.n700,
                  fontWeight: '600',
                },
              ]}>
              {t(option.labelKey)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    height: 28,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
