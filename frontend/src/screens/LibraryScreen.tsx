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
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Search, BookOpen, Camera, PenLine} from 'lucide-react-native';
import type {MainStackParamList} from '../navigation/types';
import {MOCK_LIBRARY_BOOKS, type BookStatus} from '../mocks/libraryBooks';
import {useTheme} from '../theme';

/** Frame 03 · 서재 탭 (목록) — design/hifi_mockup_v1.html 기준. 카드 탭 시 Frame 03.1(책 상세)로 이동 */
export function LibraryScreen() {
  const {colors, typography, radii} = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  const [statusFilter, setStatusFilter] = useState<BookStatus>('reading');
  const [query, setQuery] = useState('');

  const books = MOCK_LIBRARY_BOOKS.filter(
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
            books.map(book => {
              const photoCount = book.photos.length;
              const hasNote = Boolean(book.noteText);
              return (
                <TouchableOpacity
                  key={book.id}
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.hairline,
                      borderRadius: radii.card,
                    },
                  ]}
                  onPress={() =>
                    navigation.navigate('BookDetail', {bookId: book.id})
                  }>
                  <View
                    style={[styles.coverBox, {backgroundColor: colors.p50}]}>
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
                          color={photoCount > 0 ? colors.n500 : colors.n400}
                        />
                        <Text
                          style={[
                            typography.caption,
                            {
                              color: photoCount > 0 ? colors.n500 : colors.n400,
                              fontSize: 9.5,
                            },
                          ]}>
                          {photoCount > 0
                            ? `사진 ${photoCount}장`
                            : '사진 없음'}
                        </Text>
                      </View>
                      <View style={styles.metaItem}>
                        <PenLine
                          size={11}
                          color={hasNote ? colors.n500 : colors.n400}
                        />
                        <Text
                          style={[
                            typography.caption,
                            {
                              color: hasNote ? colors.n500 : colors.n400,
                              fontSize: 9.5,
                            },
                          ]}>
                          {hasNote ? '소감 있음' : '소감 없음'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
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
