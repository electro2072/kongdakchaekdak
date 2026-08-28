import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {CalendarDays, MapPin} from 'lucide-react-native';
import {MOCK_MEETING_DETAIL} from '../mocks/meetingDetail';
import {useTheme} from '../theme';

/**
 * Frame 02.1 · 일정 상세 — Hi-Fi 목업 v1.3.2 기준(claude/독서기록앱_디자인시스템_Hifi목업_v1.md).
 * ScheduleScreen(Frame 02)의 "이번주 일정 카드"를 탭하면 이 화면으로 진입한다.
 * 테스터 리포트 FINDING-20260828-10 반영 — 이전엔 이 화면 자체가 없어 카드에 진입점이 없었음.
 *
 * "캘린더에 추가"/"모임 상세보기" 버튼은 캘린더 연동·그룹 상세 API 전이라 지금은 UI만 있고
 * 동작하지 않는다 — ShareScreen의 "앱 내 공유"/"SNS 공유"와 같은 패턴(다음 라운드에서 연동).
 */
export function ScheduleDetailScreen() {
  const {colors, typography, radii} = useTheme();
  const meeting = MOCK_MEETING_DETAIL;
  const extraParticipants = Math.max(meeting.participantCount - 3, 0);

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.surface}]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.p50,
              borderColor: colors.hairline,
              borderRadius: radii.card,
            },
          ]}>
          <Text style={[typography.h3, {color: colors.n900, marginBottom: 10}]}>
            {meeting.groupName}
          </Text>
          <View style={styles.infoRow}>
            <CalendarDays size={15} color={colors.p700} />
            <Text style={[typography.caption, {color: colors.n700, fontSize: 11.5}]}>
              {meeting.dateLabel} · {meeting.timeLabel}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <MapPin size={15} color={colors.p700} />
            <Text style={[typography.caption, {color: colors.n700, fontSize: 11.5}]}>
              {meeting.location}
            </Text>
          </View>

          <View style={styles.participantsRow}>
            {Array.from({length: 3}).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.avatar,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.p50,
                    marginLeft: index === 0 ? 0 : -10,
                  },
                ]}
              />
            ))}
            {extraParticipants > 0 && (
              <View
                style={[
                  styles.avatar,
                  styles.moreBadge,
                  {backgroundColor: colors.accentSolidBg, borderColor: colors.p50},
                ]}>
                <Text
                  style={[
                    typography.caption,
                    {color: colors.onAccentSolid, fontSize: 9.5, fontWeight: '700'},
                  ]}>
                  +{extraParticipants}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View
          style={[
            styles.noteCard,
            {borderColor: colors.hairline, borderRadius: radii.card},
          ]}>
          <Text style={[typography.caption, {color: colors.n700, lineHeight: 18}]}>
            {meeting.noteText}
          </Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[
              styles.outlineButton,
              {borderColor: colors.p700, borderRadius: radii.md},
            ]}>
            <Text style={[typography.button, {color: colors.p700}]}>
              캘린더에 추가
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              {backgroundColor: colors.accentSolidBg, borderRadius: radii.md},
            ]}>
            <Text style={[typography.button, {color: colors.onAccentSolid}]}>
              모임 상세보기
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 24,
  },
  card: {
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
  },
  moreBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -10,
  },
  noteCard: {
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  outlineButton: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
