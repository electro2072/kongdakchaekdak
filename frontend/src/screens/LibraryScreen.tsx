import React, {useState} from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {Search, BookOpen, Camera, PenLine} from 'lucide-react-native';
import {useTheme} from '../theme';

type BookStatus = 'reading' | 'done';

interface LibraryBook {
  id: string;
  title: string;
  author: string;
  status: BookStatus;
  dateRangeLabel: string;
  photoCount: number;
  hasNote: boolean;
}

// TODO: GET /api/books 프론트 연동 전이라 화면설계서(Frame 03) 그대로의 mock 데이터를 사용한다.
const MOCK_BOOKS: LibraryBook[] = [
  {
    id: '1',
    title: '아몬드',
    author: '손원평',
    status: 'done',
    dateRangeLabel: '2026.06.20 ~ 2026.06.28 (9일)',
    photoCount: 3,
    hasNote: true,
  },
  {
    id: '2',
    title: '채식주의자',
    author: '한강',
    status: 'reading',
    dateRangeLabel: '2026.06.25 ~ 진행중',
    photoCount: 0,
    hasNote: false,
  },
  {
    id: '3',
    title: '데미안',
    author: '헤르만 헤세',
    status: 'reading',
    dateRangeLabel: '2026.07.10 ~ 진행중',
    photoCount: 0,
    hasNote: false,
  },
];

/** Frame 03 · 서재 탭 (목록) — design/hifi_mockup_v1.html 기준. 책 상세(Frame 03.1)는 이후 작업 */
export function LibraryScreen() {
  const {colors, typography, radii} = useTheme();

  const [statusFilter, setStatusFilter] = useState<BookStatus>('reading');
  const [query, setQuery] = useState('');

  const books = MOCK_BOOKS.filter(
    book => book.status === statusFilter && book.title.includes(query.trim()),
  );

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.surface}]}>
      <View style={styles.content}>
        <Text style={[typography.h3, {color: colors.n900, marginBottom: 12}]}>
          서재
        </Text>

        <View style={styles.filterRow}>
          {(
            [
              {key: 'reading', label: '읽고 있는 책'},
              {key: 'done', label: '읽은 책'},
            ] as const
          ).map(tab => {
            const selected = statusFilter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.filterChip,
                  {
                    borderRadius: radii.pill,
                    backgroundColor: selected
                      ? colors.accentSolidBg
                      : colors.n100,
                  },
                ]}
                onPress={() => setStatusFilter(tab.key)}>
                <Text
                  style={[
                    typography.caption,
                    {
                      color: selected ? colors.onAccentSolid : colors.n700,
                      fontWeight: selected ? '600' : '400',
                    },
                  ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.searchRow}>
          <View
            style={[
              styles.searchBox,
              {
                backgroundColor: colors.n50,
                borderColor: colors.n200,
                borderRadius: radii.sm,
              },
            ]}>
            <Search size={14} color={colors.n400} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="책 제목으로 검색"
              placeholderTextColor={colors.n400}
              style={[
                typography.caption,
                {flex: 1, color: colors.n900, marginLeft: 6, fontSize: 10.5},
              ]}
            />
          </View>
          <View
            style={[
              styles.sortChip,
              {backgroundColor: colors.n100, borderRadius: radii.pill},
            ]}>
            <Text style={[typography.caption, {color: colors.n700}]}>
              최근순 ▾
            </Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}>
          {books.length === 0 ? (
            <Text
              style={[
                typography.caption,
                {color: colors.n600, textAlign: 'center', marginTop: 40},
              ]}>
              해당하는 책이 없어요
            </Text>
          ) : (
            books.map(book => (
              <View
                key={book.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.hairline,
                    borderRadius: radii.card,
                  },
                ]}>
                <View style={[styles.coverBox, {backgroundColor: colors.p50}]}>
                  <BookOpen size={20} color={colors.p400} />
                </View>
                <View style={{flex: 1}}>
                  <Text
                    style={[
                      typography.bodyStrong,
                      {color: colors.n900, fontSize: 12.5},
                    ]}>
                    {book.title} ({book.author})
                  </Text>
                  <Text
                    style={[
                      typography.caption,
                      {color: colors.n600, marginVertical: 3, fontSize: 10},
                    ]}>
                    {book.dateRangeLabel}
                  </Text>
                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Camera
                        size={11}
                        color={book.photoCount > 0 ? colors.n500 : colors.n400}
                      />
                      <Text
                        style={[
                          typography.caption,
                          {
                            color:
                              book.photoCount > 0 ? colors.n500 : colors.n400,
                            fontSize: 9.5,
                          },
                        ]}>
                        {book.photoCount > 0
                          ? `사진 ${book.photoCount}장`
                          : '사진 없음'}
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <PenLine
                        size={11}
                        color={book.hasNote ? colors.n500 : colors.n400}
                      />
                      <Text
                        style={[
                          typography.caption,
                          {
                            color: book.hasNote ? colors.n500 : colors.n400,
                            fontSize: 9.5,
                          },
                        ]}>
                        {book.hasNote ? '소감 있음' : '소감 없음'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
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
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  filterChip: {
    flex: 1,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  searchBox: {
    flex: 1,
    height: 32,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  sortChip: {
    height: 32,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  list: {
    paddingBottom: 24,
    gap: 8,
  },
  card: {
    flexDirection: 'row',
    gap: 10,
    borderWidth: 1,
    padding: 10,
  },
  coverBox: {
    width: 42,
    height: 58,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
});
