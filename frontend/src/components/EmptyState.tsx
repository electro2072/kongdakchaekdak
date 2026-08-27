import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import type {LucideIcon} from 'lucide-react-native';
import {useTheme} from '../theme';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * 공통 빈 상태 컴포넌트 (design/hifi_mockup_v1.html Frame 07·08 기준).
 * 서재 목록이 비었을 때, 책 검색 결과가 없을 때 등 "지금은 보여줄 항목이 없음"을
 * 알리는 화면 어디서든 재사용한다. actionLabel/onAction을 함께 주면 CTA 버튼이 뜬다.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const {colors, typography, radii} = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.iconBox, {backgroundColor: colors.p50}]}>
        <Icon size={26} color={colors.p400} />
      </View>
      <Text style={[typography.h3, {color: colors.n900, marginBottom: 6}]}>
        {title}
      </Text>
      {description ? (
        <Text
          style={[
            typography.caption,
            {color: colors.n600, textAlign: 'center'},
          ]}>
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <TouchableOpacity
          style={[
            styles.actionButton,
            {borderColor: colors.p700, borderRadius: radii.md},
          ]}
          onPress={onAction}>
          <Text style={[typography.button, {color: colors.p700}]}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  actionButton: {
    height: 38,
    borderWidth: 1,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
});
