import React, {useState} from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {BookOpen, Check} from 'lucide-react-native';
import type {MainStackParamList} from '../navigation/types';
import {useLibrary} from '../navigation/LibraryContext';
import {INTEREST_OPTIONS, type Genre} from '../constants/profileOptions';
import {GENRE_CHIP_COLORS} from '../constants/genreColors';
import {useTheme} from '../theme';

/** 오늘 날짜를 "YYYY.MM.DD" 형식으로 — 서재 목록/상세의 기존 dateRangeLabel 표기와 동일한 포맷 */
function formatDateDot(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}.${m}.${d}`;
}

/**
 * Frame 08.2 · 책 등록 확인 — 설계 문서(claude/독서기록앱_프론트_책등록확인화면_프로필편집연결_설계_v1.md)
 * 2장 기준. BookSearchScreen(Frame 03)에서 검색 결과를 선택하면 이 화면으로 진입해서, 장르를
 * 단일선택(관심분야와 같은 6개 카테고리 — 디자인 확인 완료)한 뒤 "서재에 등록하기"를 누르면
 * LibraryContext에 새 책이 추가되고 방금 등록한 책의 상세(Frame 03.1)로 이동한다.
 *
 * POST /api/books 연동 전이라 AuthContext/ProfileContext와 동일한 패턴으로 LibraryContext
 * 로컬 state에만 추가한다 — 실제 연동 시 LibraryContext.addBook 내부만 API 호출로 교체하면 된다.
 * 독서 시작일은 오늘 날짜로 자동 기록되고(Frame 03.1 "읽은 기간" 자동계산 규칙과 동일 방식),
 * 상태는 항상 'reading'으로 시작한다(완독 처리는 책 상세 화면에서 별도로 한다).
 */
export function BookRegisterConfirmScreen() {
  const {colors, typography, radii, isDark} = useTheme();
  const route =
    useRoute<RouteProp<MainStackParamList, 'BookRegisterConfirm'>>();
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const {addBook} = useLibrary();
  const {book} = route.params;

  const [genre, setGenre] = useState<Genre | null>(null);

  const handleConfirm = () => {
    if (!genre) {
      return;
    }
    addBook({
      id: book.id,
      title: book.title,
      author: book.author,
      status: 'reading',
      dateRangeLabel: `${formatDateDot(new Date())} ~ 진행중`,
      photos: [],
      genre,
    });
    // 뒤로가기 시 검색 화면이 아니라 서재 탭으로 돌아가도록 스택 맨 아래(Tabs)까지 걷어낸 뒤 push
    navigation.popToTop();
    navigation.navigate('BookDetail', {bookId: book.id});
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.surface}]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          {book.coverImageUrl ? (
            <Image source={{uri: book.coverImageUrl}} style={styles.cover} />
          ) : (
            <View
              style={[
                styles.cover,
                styles.coverPlaceholder,
                {backgroundColor: colors.p50},
              ]}>
              <BookOpen size={26} color={colors.p400} />
            </View>
          )}
          <View style={styles.headerText}>
            <Text
              style={[
                typography.bodyStrong,
                {color: colors.n900, fontSize: 14},
              ]}>
              {book.title}
            </Text>
            <Text
              style={[
                typography.caption,
                {color: colors.n600, marginTop: 3},
              ]}>
              {book.author}
            </Text>
            <Text
              style={[
                typography.caption,
                {color: colors.n500, marginTop: 1, fontSize: 10.5},
              ]}>
              {book.publisher}
            </Text>
          </View>
        </View>

        <Text
          style={[typography.overline, {color: colors.n600, marginBottom: 8}]}>
          장르 (필수)
        </Text>
        <View style={[styles.row, styles.wrap]}>
          {INTEREST_OPTIONS.map(item => {
            const selected = genre === item;
            const chipColor = GENRE_CHIP_COLORS[item][isDark ? 'dark' : 'light'];
            return (
              <TouchableOpacity
                key={item}
                testID={`genre-chip-${item}`}
                style={[
                  styles.chip,
                  {
                    borderRadius: radii.pill,
                    backgroundColor: selected ? chipColor.bg : colors.n100,
                  },
                ]}
                onPress={() => setGenre(item)}>
                {selected ? <Check size={12} color={chipColor.text} /> : null}
                <Text
                  style={[
                    typography.caption,
                    {
                      color: selected ? chipColor.text : colors.n700,
                      fontWeight: selected ? '600' : '400',
                      marginLeft: selected ? 4 : 0,
                    },
                  ]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          testID="cancel-button"
          style={[
            styles.outlineButton,
            {borderColor: colors.n300, borderRadius: radii.pill},
          ]}
          onPress={() => navigation.goBack()}>
          <Text style={[typography.button, {color: colors.n700}]}>취소</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="confirm-button"
          style={[
            styles.primaryButton,
            {backgroundColor: colors.accentSolidBg, borderRadius: radii.pill},
            !genre && {opacity: 0.5},
          ]}
          onPress={handleConfirm}
          disabled={!genre}>
          <Text style={[typography.button, {color: colors.onAccentSolid}]}>
            서재에 등록하기
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  header: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  cover: {
    width: 66,
    height: 90,
    borderRadius: 8,
    flexShrink: 0,
  },
  coverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    paddingTop: 2,
  },
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  wrap: {
    flexWrap: 'wrap',
  },
  chip: {
    height: 30,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 8,
  },
  outlineButton: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    flex: 2,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
