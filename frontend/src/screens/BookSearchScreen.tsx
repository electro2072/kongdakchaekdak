import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SearchBar } from "../components/SearchBar";
import { BookList } from "../components/BookList";
import { NetworkError } from "../components/NetworkError";
import { useBookSearch } from "../hooks/useBookSearch";
import { Book } from "../types/book";
import type { MainStackParamList } from "../navigation/types";

interface BookSearchScreenProps {
  /** 책을 선택했을 때 (독서 기록 작성 화면 Frame 03의 다음 단계로 연결). 안 넘기면 기본 동작(Alert 후 뒤로가기)을 쓴다. */
  onSelectBook?: (book: Book) => void;
}

/**
 * Frame 03(독서 기록 작성)의 "책 검색/선택" 화면.
 * ScheduleScreen의 "새 책 등록하기", LibraryScreen 빈 상태의 "책 등록하기"에서
 * MainStack의 모달 화면으로 진입한다.
 */
export function BookSearchScreen({ onSelectBook }: BookSearchScreenProps) {
  const { books, isLoading, error, search, lastQuery } = useBookSearch();
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  // Frame 08.2(책 등록 확인)로 이동해서 장르를 고른 뒤 실제로 서재(LibraryContext)에 등록한다.
  const handleSelectBook = (book: Book) => {
    if (onSelectBook) {
      onSelectBook(book);
      return;
    }
    navigation.navigate("BookRegisterConfirm", { book });
  };

  return (
    <SafeAreaView style={styles.container}>
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
    backgroundColor: "#fff",
  },
});
