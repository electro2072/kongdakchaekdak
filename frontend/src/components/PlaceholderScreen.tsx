import React from 'react';
import {SafeAreaView, Text, View, StyleSheet} from 'react-native';
import type {LucideIcon} from 'lucide-react-native';
import {useTheme} from '../theme';

interface PlaceholderScreenProps {
  icon: LucideIcon;
  title: string;
  frameLabel: string;
  description: string;
}

/**
 * 탭 내용이 아직 없는 화면의 자리표시자.
 * 와이어프레임(docs/독서기록공유앱_화면설계서_wireframe_v2-5.html) 기준 프레임 번호와
 * 설명만 보여주고, 실제 UI는 다음 세션에서 이 자리를 채운다.
 */
export function PlaceholderScreen({
  icon: Icon,
  title,
  frameLabel,
  description,
}: PlaceholderScreenProps) {
  const {colors, typography} = useTheme();

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.surface}]}>
      <View style={styles.content}>
        <View style={[styles.iconBox, {backgroundColor: colors.p50}]}>
          <Icon size={28} color={colors.p400} />
        </View>
        <Text style={[typography.h3, {color: colors.n900, marginBottom: 6}]}>
          {title}
        </Text>
        <Text
          style={[typography.overline, {color: colors.p700, marginBottom: 16}]}>
          {frameLabel} · 준비 중
        </Text>
        <Text
          style={[
            typography.caption,
            {color: colors.n600, textAlign: 'center'},
          ]}>
          {description}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
});
