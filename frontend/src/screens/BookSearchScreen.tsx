import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import { SearchBar } from "../components/SearchBar";
import { BookList } from "../components/BookList";
import { useBookSearch } from "../hooks/useBookSearch";
import { Book } from "../types/book";

interface BookSearchScreenProps {
  /** 책을 선택했을 때 (독서 기록 작성 화면 Frame 03의 다음 단계로 연결) */
  onSelectBook?: (book: Book) => void;
}

/** Frame 03(독서 기록 작성)의 "책 검색/선택" 화면 */
export function BookSearchScreen({ onSelectBook }: BookSearchScreenProps) {
  const { books, isLoading, error, search } = useBookSearch();

  return (
    <SafeAreaView style={styles.container}>
      <SearchBar onSearch={search} isLoading={isLoading} />
      {error ? null : null}
      <BookList books={books} isLoading={isLoading} onSelectBook={onSelectBook} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
