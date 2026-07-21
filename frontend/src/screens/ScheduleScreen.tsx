import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {Bell, BookOpen, CalendarDays, Plus} from 'lucide-react-native';
import {useTheme} from '../theme';

type DayState = 'normal' | 'today' | 'meeting';

const WEEK_DAYS: {label: string; state: DayState; date?: number}[] = [
  {label: '월', state: 'normal'},
  {label: '화', state: 'normal'},
  {label: '수', state: 'today', date: 18},
  {label: '목', state: 'normal'},
  {label: '금', state: 'normal'},
  {label: '토', state: 'meeting'},
  {label: '일', state: 'normal'},
];

// TODO: Book/BookNote API 프론트 연동 전이라 화면설계서(Frame 02) 그대로의 mock 데이터를 사용한다.
const MONTH_LABEL = '2026년 7월';
const COMPLETED_THIS_MONTH = 3;
const CURRENT_READING = {
  title: '아몬드',
  lastReadPage: 62,
  progressPercent: 62,
};
const UPCOMING_MEETING = {groupName: '책벙개', dateLabel: '7월 20일(토) 14:00'};
const READING_NOW_COUNT = 2;

/** Frame 02 · 일정 탭 (design/hifi_mockup_v1.html 기준: 이번달 독서 일정, 캘린더 스트립, 오늘의 리딩 카드) */
export function ScheduleScreen() {
  const {colors, typography, radii} = useTheme();

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.surface}]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text
              style={[typography.h2, {fontWeight: '800', color: colors.n900}]}>
              이번달 독서 일정
            </Text>
            <Text
              style={[
                typography.overline,
                {color: colors.n600, marginTop: 4, textTransform: 'none'},
              ]}>
              {MONTH_LABEL} · 지금까지 {COMPLETED_THIS_MONTH}권 완독
            </Text>
          </View>
          <Bell size={20} color={colors.n600} />
        </View>

        <View style={styles.weekRow}>
          {WEEK_DAYS.map(day => (
            <View key={day.label} style={styles.dayColumn}>
              <Text
                style={[
                  typography.overline,
                  {color: colors.n500, marginBottom: 6, textTransform: 'none'},
                ]}>
                {day.label}
              </Text>
              <View
                style={[
                  styles.dayDot,
                  day.state === 'today' && {
                    backgroundColor: colors.accentSolidBg,
                  },
                  day.state === 'meeting' && {backgroundColor: colors.warnBg},
                ]}>
                {day.state === 'today' && (
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: colors.onAccentSolid,
                        fontWeight: '700',
                        fontSize: 11,
                      },
                    ]}>
                    {day.date}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>

        <View
          style={[
            styles.cardAccent,
            {
              backgroundColor: colors.p50,
              borderColor: colors.hairline,
              borderRadius: radii.card,
            },
          ]}>
          <View style={styles.readingRow}>
            <View
              style={[
                styles.coverBox,
                {width: 42, height: 58, backgroundColor: colors.p50},
              ]}>
              <BookOpen size={20} color={colors.p400} />
            </View>
            <View style={{flex: 1}}>
              <Text
                style={[
                  typography.bodyStrong,
                  {color: colors.n900, lineHeight: 18},
                ]}>
                오늘은 『{CURRENT_READING.title}』를{'\n'}마저 읽을 차례예요!
              </Text>
              <Text
                style={[
                  typography.caption,
                  {color: colors.n600, marginTop: 5, fontSize: 10.5},
                ]}>
                어제 {CURRENT_READING.lastReadPage}p까지 읽었어요 · 진행률{' '}
                {CURRENT_READING.progressPercent}%
              </Text>
            </View>
          </View>
          <View style={[styles.progressTrack, {backgroundColor: colors.n200}]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.accentSolidBg,
                  width: `${CURRENT_READING.progressPercent}%`,
                },
              ]}
            />
          </View>
          <TouchableOpacity
            style={[styles.pillButton, {borderColor: colors.p700}]}>
            <Text
              style={[
                typography.caption,
                {color: colors.p700, fontWeight: '600', fontSize: 11},
              ]}>
              이어서 읽기
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.hairline,
              borderRadius: radii.card,
            },
          ]}>
          <View style={styles.meetingRow}>
            <CalendarDays size={16} color={colors.warning} />
            <Text
              style={[
                typography.caption,
                {color: colors.n900, fontWeight: '700', fontSize: 12.5},
              ]}>
              이번주 독서모임 일정이 있어요!
            </Text>
          </View>
          <Text
            style={[typography.caption, {color: colors.n600, fontSize: 10.5}]}>
            {UPCOMING_MEETING.dateLabel} · 독서모임 "
            {UPCOMING_MEETING.groupName}"
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.addButton,
            {borderColor: colors.p700, borderRadius: radii.md},
          ]}>
          <Plus size={15} color={colors.p700} />
          <Text style={[typography.button, {color: colors.p700}]}>
            새 책 등록하기
          </Text>
        </TouchableOpacity>

        <Text
          style={[
            typography.overline,
            {color: colors.n600, marginBottom: 8, textTransform: 'none'},
          ]}>
          읽고 있는 책 · {READING_NOW_COUNT}
        </Text>
        <View style={styles.coverRow}>
          {Array.from({length: READING_NOW_COUNT}).map((_, index) => (
            <View
              key={index}
              style={[
                styles.coverBox,
                {width: 54, height: 74, backgroundColor: colors.p50},
              ]}>
              <BookOpen size={22} color={colors.p400} />
            </View>
          ))}
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
    paddingTop: 10,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dayColumn: {
    alignItems: 'center',
  },
  dayDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardAccent: {
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  readingRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  coverBox: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    height: 7,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  pillButton: {
    height: 30,
    borderWidth: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  meetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 6,
  },
  addButton: {
    height: 38,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  coverRow: {
    flexDirection: 'row',
    gap: 10,
  },
});
