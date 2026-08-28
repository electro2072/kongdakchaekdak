import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {BarChart3, BookOpen, Plus, Users} from 'lucide-react-native';
import type {ShareHistoryItem} from '../types/share';
import {MOCK_SHARE_GROUPS} from '../mocks/shareGroups';
import {MOCK_SHARE_HISTORY} from '../mocks/shareHistory';
import {useTheme} from '../theme';

/**
 * Frame 04.1 · 공유 탭 (그룹 관리 · 공유 이력) —
 * 화면설계서 v2-5(`독서기록공유앱_화면설계서_wireframe_v2-5.html`) Frame 04.1 기준.
 * ShareScreen(Frame 04)의 "그룹 관리 · 공유 이력" 진입 카드에서 MainStack push로 들어온다
 * (테스터 리포트 FINDING-20260828-10 — 이 화면 자체가 없어 진입점이 연결이 안 돼있었음).
 *
 * "관리"/"새 그룹 만들기" 버튼은 Group CRUD API 연동 전이라 지금은 UI만 있고 동작하지 않는다 —
 * ShareScreen의 "앱 내 공유"/"SNS 공유" 버튼과 같은 패턴(목업 그대로, 다음 라운드에서 연동).
 */
export function GroupManagementScreen() {
  const {colors, typography, radii} = useTheme();

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.surface}]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <Text
          style={[
            typography.overline,
            {color: colors.n600, marginBottom: 8, textTransform: 'none'},
          ]}>
          내 그룹
        </Text>
        {MOCK_SHARE_GROUPS.map(group => (
          <View
            key={group.id}
            style={[
              styles.groupRow,
              {borderColor: colors.hairline, borderRadius: radii.md},
            ]}>
            <View style={[styles.groupIcon, {backgroundColor: colors.p50}]}>
              <Users size={16} color={colors.p700} />
            </View>
            <Text
              style={[
                typography.caption,
                {color: colors.n900, flex: 1, fontSize: 11.5},
              ]}>
              {group.name}{' '}
              <Text style={{color: colors.n500}}>· {group.memberCount}명</Text>
            </Text>
            <TouchableOpacity
              style={[styles.manageChip, {borderColor: colors.hairline}]}>
              <Text style={[typography.caption, {color: colors.n600, fontSize: 10.5}]}>
                관리
              </Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity
          style={[
            styles.addGroupButton,
            {borderColor: colors.p700, borderRadius: radii.md},
          ]}>
          <Plus size={14} color={colors.p700} />
          <Text style={[typography.button, {color: colors.p700}]}>
            새 그룹 만들기
          </Text>
        </TouchableOpacity>

        <Text
          style={[
            typography.overline,
            {
              color: colors.n600,
              marginTop: 22,
              marginBottom: 8,
              textTransform: 'none',
            },
          ]}>
          공유 이력
        </Text>
        {MOCK_SHARE_HISTORY.map(item => (
          <HistoryRow key={item.id} item={item} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function HistoryRow({item}: {item: ShareHistoryItem}) {
  const {colors, typography} = useTheme();
  const Icon = item.icon === 'dashboard' ? BarChart3 : BookOpen;

  return (
    <View style={styles.historyRow}>
      <Icon size={13} color={colors.n500} />
      <Text style={[typography.caption, {color: colors.n700, fontSize: 11}]}>
        {item.title} → {item.targetLabel} · {item.dateLabel}
      </Text>
    </View>
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
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    padding: 8,
    marginBottom: 6,
  },
  groupIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageChip: {
    height: 24,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addGroupButton: {
    height: 38,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
});
