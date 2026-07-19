import React from "react";
import { FlatList, View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Book } from "../types/book";
import { BookListItem } from "./BookListItem";

interface BookListProps {
  books: Book[];
  isLoading: boolean;
  onSelectBook?: (book: Book) => void;
}

/** FlatList 목록. 로딩/빈 상태 처리. API를 모르고 props로만 동작한다. */
export function BookList({ books, isLoading, onSelectBook }: BookListProps) {
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (books.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={books}
      keyExtractor={(item) => `${item.providerId}-${item.id}`}
      renderItem={({ item }) => <BookListItem book={item} onPress={onSelectBook} />}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    color: "#999",
  },
});
