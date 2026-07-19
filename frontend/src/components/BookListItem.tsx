import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Book } from "../types/book";

interface BookListItemProps {
  book: Book;
  onPress?: (book: Book) => void;
}

/** 도서 1권 카드: 표지·제목·저자·출판사. API를 모르고 props로만 동작한다. */
export function BookListItem({ book, onPress }: BookListItemProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress?.(book)}>
      {book.coverImageUrl ? (
        <Image source={{ uri: book.coverImageUrl }} style={styles.cover} />
      ) : (
        <View style={[styles.cover, styles.coverPlaceholder]} />
      )}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {book.author}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {book.publisher}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 12,
    gap: 12,
  },
  cover: {
    width: 56,
    height: 80,
    borderRadius: 4,
  },
  coverPlaceholder: {
    backgroundColor: "#eee",
  },
  info: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
  },
  meta: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
});
