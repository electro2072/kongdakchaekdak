import React from 'react';
import {Alert, SafeAreaView, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {SearchBar} from '../components/SearchBar';
import {BookList} from '../components/BookList';
import {NetworkError} from '../components/NetworkError';
import {useBookSearch} from '../hooks/useBookSearch';
import {Book} from '../types/book';
import type {MainStackParamList} from '../navigation/types';
import {useTheme} from '../theme';

interface BookSearchScreenProps {
  /** 책을 선택했을 때 (독서 기록 작성 화면 Frame 03의 다음 단계로 연결). 안 넘기면 기본 동작(Alert 후 뒤로가기)을 쓴다. */
  onSelectBook?: (book: Book) => void;
}

/**
 * Frame 03(독서 기록 작성)의 "책 검색/선택" 화면.
 * ScheduleScreen의 "새 책 등록하기", LibraryScreen 빈 상태의 "책 등록하기"에서
 * MainStack의 모달 화면으로 진입한다.
 *
 * 테스터 리포트 FINDING-20260828-09: 배경이 테마 무관하게 `#fff`로 하드코딩돼 있어
 * 다크모드에서만 흰 배경으로 튀었고(10개 화면 중 이 화면만), 다른 화면들과 달리 큰따옴표
 * 컨벤션을 쓰고 있었다 — 둘 다 이번에 다른 화면들(작은따옴표 + `colors.surface`)에 맞춤.
 */
export function BookSearchScreen({onSelectBook}: BookSearchScreenProps) {
  const {books, isLoading, error, search, lastQuery} = useBookSearch();
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const {colors} = useTheme();

  // TODO: 실제 서재 등록(POST /api/books)은 mock→API 연동 작업에서 붙인다.
  // 지금은 목데이터 화면이라 선택 사실만 알려주고 뒤로 돌아간다.
  const handleSelectBook = (book: Book) => {
    if (onSelectBook) {
      onSelectBook(book);
      return;
    }
    Alert.alert(
      '책을 선택했어요',
      `『${book.title}』을(를) 서재에 등록할게요.`,
      [{text: '확인', onPress: () => navigation.goBack()}],
    );
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.surface}]}>
      <SearchBar onSearch={search} isLoading={isLoading} />
      {error ? (
        <NetworkError message={error} onRetry={() => search(lastQuery)} />
      ) : (
        <BookList
          books={books}
          isLoading={isLoading}
          onSelectBook={handleSelectBook}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
