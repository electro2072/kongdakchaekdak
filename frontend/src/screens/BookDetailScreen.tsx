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
  Camera,
  Image as ImageIcon,
  PenLine,
  CheckCircle,
  Share2,
} from 'lucide-react-native';
import type {MainStackParamList} from '../navigation/types';
import {MOCK_LIBRARY_BOOKS} from '../mocks/libraryBooks';
import {useTheme} from '../theme';

/** Frame 03.1 · 서재 탭(책 상세) — design/hifi_mockup_v1.html 기준. 탭바 없이 전체화면으로 push된다 */
export function BookDetailScreen() {
  const {colors, typography, radii} = useTheme();
  const route = useRoute<RouteProp<MainStackParamList, 'BookDetail'>>();
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const book = MOCK_LIBRARY_BOOKS.find(b => b.id === route.params.bookId);

  // TODO: PATCH /api/books/{id}/complete 연동 전이라 로컬 state로만 완독 처리 여부를 표시한다.
  const [isDone, setIsDone] = useState(book?.status === 'done');

  if (!book) {
    return (
      <SafeAreaView
        style={[styles.container, {backgroundColor: colors.surface}]}>
        <Text
          style={[
            typography.caption,
            {color: colors.n600, textAlign: 'center', marginTop: 40},
          ]}>
          책 정보를 찾을 수 없어요
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.surface}]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={[styles.coverBox, {backgroundColor: colors.p50}]}>
            <BookOpen size={26} color={colors.p400} />
          </View>
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
                {color: colors.n600, marginTop: 3, marginBottom: 8},
              ]}>
              {book.author}
            </Text>
            <Text
              style={[typography.caption, {color: colors.n600, fontSize: 10}]}>
              읽은 기간{'\n'}
              <Text
                style={{color: colors.n900, fontSize: 11, fontWeight: '700'}}>
                {book.dateRangeLabel}
              </Text>
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <Camera size={13} color={colors.n600} />
            <Text style={[typography.caption, {color: colors.n600}]}>
              장소 사진
            </Text>
          </View>
          {book.photos.length === 0 ? (
            <Text style={[typography.caption, {color: colors.n500}]}>
              아직 등록된 사진이 없어요
            </Text>
          ) : (
            <View style={styles.photoRow}>
              {book.photos.map((photo, index) => (
                <View key={index} style={styles.photoItem}>
                  <View
                    style={[styles.photoBox, {backgroundColor: colors.p50}]}>
                    <ImageIcon size={22} color={colors.p400} />
                  </View>
                  <Text
                    style={[
                      typography.caption,
                      {color: colors.n500, marginTop: 3, fontSize: 9},
                    ]}>
                    {photo.label}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <PenLine size={13} color={colors.n600} />
            <Text style={[typography.caption, {color: colors.n600}]}>소감</Text>
          </View>
          {book.noteText ? (
            <View
              style={[
                styles.noteCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.hairline,
                  borderRadius: radii.card,
                },
              ]}>
              <Text
                style={[
                  typography.caption,
                  {color: colors.n700, fontSize: 10.5, lineHeight: 17},
                ]}>
                {book.noteText}
              </Text>
            </View>
          ) : (
            <Text style={[typography.caption, {color: colors.n500}]}>
              아직 작성한 소감이 없어요
            </Text>
          )}
        </View>

        {!isDone && (
          <TouchableOpacity
            style={[
              styles.outlineButton,
              {borderColor: colors.p700, borderRadius: radii.md},
            ]}
            onPress={() => setIsDone(true)}>
            <CheckCircle size={15} color={colors.p700} />
            <Text style={[typography.button, {color: colors.p700}]}>
              다 읽었어요 (완독 처리)
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.primaryButton,
            {backgroundColor: colors.accentSolidBg, borderRadius: radii.pill},
          ]}
          onPress={() =>
            navigation.navigate('Tabs', {
              screen: 'Share',
              params: {bookId: book.id},
            })
          }>
          <Share2 size={15} color={colors.onAccentSolid} />
          <Text style={[typography.button, {color: colors.onAccentSolid}]}>
            이 책 공유하기
          </Text>
        </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  coverBox: {
    width: 66,
    height: 90,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerText: {
    flex: 1,
    paddingTop: 2,
  },
  section: {
    marginBottom: 16,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  photoRow: {
    flexDirection: 'row',
    gap: 7,
  },
  photoItem: {
    alignItems: 'center',
  },
  photoBox: {
    width: 66,
    height: 66,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteCard: {
    borderWidth: 1,
    padding: 12,
  },
  outlineButton: {
    height: 38,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 10,
  },
  primaryButton: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
});
