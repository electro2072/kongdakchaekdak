import React, {useState} from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {
  BookOpen,
  Check,
  Bell,
  ChevronRight,
  Share2,
  MessageCircle,
  Users,
} from 'lucide-react-native';
import type {MainStackParamList, MainTabParamList} from '../navigation/types';
import type {ShareScope} from '../types/share';
import {useLibrary} from '../navigation/LibraryContext';
import {MOCK_SHARE_GROUPS} from '../mocks/shareGroups';
import {useTheme} from '../theme';
import {t, type StringKey} from '../strings';

const SCOPE_OPTIONS: {key: ShareScope; labelKey: StringKey}[] = [
  {key: 'all', labelKey: 'share.scopeAll'},
  {key: 'group', labelKey: 'share.scopeGroup'},
  {key: 'custom', labelKey: 'share.scopeCustom'},
];

/**
 * Frame 04 · 공유 탭 — design/hifi_mockup_v1.html 기준.
 * "그룹 관리 · 공유 이력" 카드는 Frame 04.1(GroupManagementScreen)로 이동 —
 * 테스터 리포트 FINDING-20260828-10 반영(이전엔 이 화면 자체가 없어 진입점이 없었음).
 */
export function ShareScreen() {
  const {colors, typography, radii} = useTheme();
  const route = useRoute<RouteProp<MainTabParamList, 'Share'>>();
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const bookId = route.params?.bookId;
  // 정적 목업 대신 실제 서재 상태에서 찾는다 — 책 id가 서버에서 발급되는 값이라
  // MOCK_LIBRARY_BOOKS로는 상세 화면에서 넘어온 책을 절대 못 찾는다.
  const {books} = useLibrary();
  const book = bookId ? books.find(b => b.id === bookId) : undefined;

  const [scope, setScope] = useState<ShareScope>('group');

  const scopeLabel = (option: (typeof SCOPE_OPTIONS)[number]) => {
    if (option.key !== 'group') {
      return t(option.labelKey);
    }
    const summary = MOCK_SHARE_GROUPS.map(
      g => `${g.name}(${g.memberCount})`,
    ).join(' · ');
    return t('share.scopeSummary', {label: t(option.labelKey), summary});
  };

  const groupLinkCard = (
    <TouchableOpacity
      testID="group-management-link"
      style={[
        styles.groupLinkCard,
        {
          backgroundColor: colors.p50,
          borderColor: colors.hairline,
          borderRadius: radii.card,
        },
      ]}
      onPress={() => navigation.navigate('GroupManagement')}>
      <View style={styles.groupLinkLeft}>
        <Users size={18} color={colors.p700} />
        <Text
          style={[typography.bodyStrong, {color: colors.n900, fontSize: 12.5}]}>
          {t('share.groupHistoryLink')}
        </Text>
      </View>
      <ChevronRight size={16} color={colors.n500} />
    </TouchableOpacity>
  );

  if (!book) {
    return (
      <SafeAreaView
        style={[styles.container, {backgroundColor: colors.surface}]}>
        <View style={styles.emptyPageHeader}>
          <Text style={[typography.h3, {color: colors.n900}]}>
            {t('share.header')}
          </Text>
        </View>
        <View style={styles.emptyPageHeader}>{groupLinkCard}</View>
        <View style={styles.emptyState}>
          <Share2 size={28} color={colors.p400} />
          <Text
            style={[
              typography.caption,
              {color: colors.n600, textAlign: 'center', marginTop: 12},
            ]}>
            {t('share.emptyTitle')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.surface}]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <Text style={[typography.h3, {color: colors.n900, marginBottom: 12}]}>
          {t('share.header')}
        </Text>

        {groupLinkCard}

        <View
          style={[
            styles.recordCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.hairline,
              borderRadius: radii.card,
            },
          ]}>
          <View style={[styles.smallCover, {backgroundColor: colors.p50}]}>
            <BookOpen size={16} color={colors.p400} />
          </View>
          <Text
            style={[typography.bodyStrong, {color: colors.n900, fontSize: 12}]}>
            {t('share.targetBook', {title: book.title})}
          </Text>
        </View>

        <Text
          style={[
            typography.overline,
            {color: colors.n600, marginBottom: 6, textTransform: 'none'},
          ]}>
          {t('share.scopeLabel')}
        </Text>
        <View style={[styles.scopeList, {borderColor: colors.hairline}]}>
          {SCOPE_OPTIONS.map((option, index) => {
            const selected = scope === option.key;
            return (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.scopeRow,
                  {
                    borderBottomColor: colors.hairline,
                    borderBottomWidth:
                      index === SCOPE_OPTIONS.length - 1 ? 0 : 1,
                  },
                ]}
                onPress={() => setScope(option.key)}>
                <Text
                  style={[
                    typography.caption,
                    {
                      color: selected ? colors.p700 : colors.n700,
                      fontWeight: selected ? '600' : '400',
                    },
                  ]}>
                  {scopeLabel(option)}
                </Text>
                {selected && <Check size={16} color={colors.p700} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text
          style={[
            typography.overline,
            {
              color: colors.n600,
              marginTop: 16,
              marginBottom: 6,
              textTransform: 'none',
            },
          ]}>
          {t('share.previewLabel')}
        </Text>
        <View
          style={[
            styles.previewCard,
            {backgroundColor: colors.p50, borderRadius: radii.card},
          ]}>
          <View
            style={[styles.previewCover, {backgroundColor: colors.surface}]}>
            <BookOpen size={20} color={colors.p400} />
          </View>
          <Text
            style={[
              typography.caption,
              {color: colors.n700, fontSize: 10.5, textAlign: 'center'},
            ]}>
            {book.notes.length > 0
              ? `${book.notes[0].content.slice(0, 12)}...`
              : t('share.noNote')}{' '}
            {t('share.completedSuffix', {dateRange: book.dateRangeLabel})}
          </Text>
        </View>

        {scope !== 'all' && (
          <View
            style={[
              styles.warningBanner,
              {backgroundColor: colors.warnBg, marginTop: 12},
            ]}>
            <Bell size={13} color={colors.warning} />
            <Text
              style={[
                typography.caption,
                {color: colors.warnText, fontSize: 11, flex: 1},
              ]}>
              {t('share.publicLinkNotice')}
            </Text>
          </View>
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              {backgroundColor: colors.accentSolidBg, borderRadius: radii.md},
            ]}>
            <Share2 size={15} color={colors.onAccentSolid} />
            <Text style={[typography.button, {color: colors.onAccentSolid}]}>
              {t('share.inAppShare')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              {borderColor: colors.hairline, borderRadius: radii.md},
            ]}>
            <MessageCircle size={15} color={colors.n700} />
            <Text style={[typography.button, {color: colors.n700}]}>
              {t('share.snsShare')}
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
    paddingTop: 12,
    paddingBottom: 24,
  },
  emptyPageHeader: {
    paddingHorizontal: 18,
    marginBottom: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  groupLinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
  },
  groupLinkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    padding: 8,
    marginBottom: 12,
  },
  smallCover: {
    width: 32,
    height: 44,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  scopeList: {
    borderWidth: 1,
    borderRadius: 10,
  },
  scopeRow: {
    height: 40,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewCard: {
    alignItems: 'center',
    padding: 14,
  },
  previewCover: {
    width: 42,
    height: 58,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 11,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 16,
  },
  primaryButton: {
    flex: 1,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  secondaryButton: {
    flex: 1,
    height: 38,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
});
