import React from 'react';
import {SafeAreaView, FlatList, View, Text, StyleSheet} from 'react-native';
import {BarChart3, CalendarClock, Heart, UserPlus} from 'lucide-react-native';
import type {NotificationItem, NotificationType} from '../types/notification';
import {MOCK_NOTIFICATIONS} from '../mocks/notifications';
import {useTheme} from '../theme';

const ICON_BY_TYPE: Record<NotificationType, typeof UserPlus> = {
  member: UserPlus,
  reaction: Heart,
  schedule: CalendarClock,
  recap: BarChart3,
};

/**
 * Frame 10 · 알림 목록 — Hi-Fi 목업 v1.3.2 기준(claude/독서기록앱_디자인시스템_Hifi목업_v1.md).
 * ScheduleScreen(Frame 02) 헤더의 종 아이콘을 탭하면 이 화면으로 진입한다.
 * 테스터 리포트 FINDING-20260828-10 반영 — 이전엔 종 아이콘에 onPress가 없어 진입점이 없었음.
 *
 * 안 읽은 알림은 우측에 포인트 컬러 도트로 표시(목업 그대로). 항목 탭 시 실제 대상 화면
 * (그룹/공유/일정/대시보드)으로 이동하는 인터랙션은 알림 API 연동 이후 다음 라운드 작업.
 */
export function NotificationScreen() {
  const {colors} = useTheme();

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.surface}]}>
      <FlatList
        data={MOCK_NOTIFICATIONS}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, {backgroundColor: colors.hairline}]} />
        )}
        renderItem={({item}) => <NotificationRow item={item} />}
      />
    </SafeAreaView>
  );
}

function NotificationRow({item}: {item: NotificationItem}) {
  const {colors, typography} = useTheme();
  const Icon = ICON_BY_TYPE[item.type];

  return (
    <View style={styles.row} testID={`notification-row-${item.id}`}>
      <View style={[styles.iconBox, {backgroundColor: colors.p50}]}>
        <Icon size={16} color={colors.p700} />
      </View>
      <View style={styles.textBlock}>
        <Text style={[typography.bodyStrong, {color: colors.n900, fontSize: 12.5}]}>
          {item.title}
        </Text>
        <Text
          style={[
            typography.caption,
            {color: colors.n600, marginTop: 2, fontSize: 10.5},
          ]}>
          {item.message}
        </Text>
        <Text
          style={[
            typography.caption,
            {color: colors.n500, marginTop: 4, fontSize: 9.5},
          ]}>
          {item.dateLabel}
        </Text>
      </View>
      {!item.isRead && (
        <View
          testID={`notification-unread-dot-${item.id}`}
          style={[styles.unreadDot, {backgroundColor: colors.accentSolidBg}]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  separator: {
    height: 1,
    marginVertical: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
});
