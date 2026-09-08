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
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {MainStackParamList} from '../navigation/types';
import {useLibrary} from '../navigation/LibraryContext';
import {useToast} from '../components/Toast';
import {useTheme} from '../theme';

const MAX_NOTE_LENGTH = 500;
const WARNING_THRESHOLD = 490;

/**
 * 소감 작성/수정 화면 — claude/독서기록앱_프론트요청_디자인_소감작성화면_장소사진추가화면_v1.md
 * 디자인 회신(2026-09-07) 기준. `route.params.noteId` 유무로 작성/수정 겸용(신규 작성이면
 * undefined). 완독 여부와 무관하게 항상 진입 가능 — BookDetailScreen의 "소감 작성하기"
 * 버튼/각 소감 카드의 "수정하기" 액션시트 옵션에서 온다.
 *
 * 디자인이 권장한 대로 전체화면 push(ProfileEditScreen과 동일 패턴) — 멀티라인 입력은 키보드가
 * 화면 상당 부분을 가려서, 인라인 편집보다 전체화면이 더 안전하다는 이유.
 */
export function BookNoteEditScreen() {
  const {colors, typography, radii} = useTheme();
  const route = useRoute<RouteProp<MainStackParamList, 'BookNoteEdit'>>();
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const {books, addNote, updateNote} = useLibrary();
  const {showToast} = useToast();
  const {bookId, noteId} = route.params;

  const book = books.find(b => b.id === bookId);
  const existingNote = noteId
    ? book?.notes.find(n => n.id === noteId)
    : undefined;

  const [content, setContent] = useState(existingNote?.content ?? '');
  const trimmed = content.trim();
  const canSave = trimmed.length > 0;
  const counterColor =
    content.length >= WARNING_THRESHOLD ? colors.error : colors.n500;

  const handleSave = () => {
    if (!canSave) {
      return;
    }
    if (existingNote && noteId) {
      updateNote(bookId, noteId, trimmed);
      showToast({type: 'success', message: '소감을 수정했어요'});
    } else {
      addNote(bookId, trimmed);
      showToast({type: 'success', message: '소감을 저장했어요'});
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.surface}]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <TextInput
          testID="note-input"
          value={content}
          onChangeText={text => setContent(text.slice(0, MAX_NOTE_LENGTH))}
          placeholder="이 책을 읽으며 든 생각을 자유롭게 남겨보세요"
          placeholderTextColor={colors.n400}
          multiline
          maxLength={MAX_NOTE_LENGTH}
          textAlignVertical="top"
          autoCorrect={false}
          spellCheck={false}
          style={[
            styles.input,
            {
              backgroundColor: colors.n50,
              borderColor: colors.n300,
              color: colors.n900,
              borderRadius: radii.sm,
            },
          ]}
        />
        <Text
          style={[
            typography.caption,
            {color: counterColor, fontSize: 11, textAlign: 'right', marginTop: 6},
          ]}>
          {content.length}/{MAX_NOTE_LENGTH}
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          testID="note-cancel-button"
          style={[
            styles.outlineButton,
            {borderColor: colors.n300, borderRadius: radii.pill},
          ]}
          onPress={() => navigation.goBack()}>
          <Text style={[typography.button, {color: colors.n700}]}>취소</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="note-save-button"
          style={[
            styles.primaryButton,
            {backgroundColor: colors.accentSolidBg, borderRadius: radii.pill},
            !canSave && {opacity: 0.5},
          ]}
          onPress={handleSave}
          disabled={!canSave}>
          <Text style={[typography.button, {color: colors.onAccentSolid}]}>
            저장하기
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    flexGrow: 1,
  },
  input: {
    minHeight: 180,
    borderWidth: 1,
    padding: 12,
    fontSize: 13,
    lineHeight: 19,
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 12,
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
