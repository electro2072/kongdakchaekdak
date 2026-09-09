import React from 'react';
import {FlatList, View, StyleSheet} from 'react-native';
import {SearchX} from 'lucide-react-native';
import {Book} from '../types/book';
import {BookListItem} from './BookListItem';
import {EmptyState} from './EmptyState';
import {LoadingSkeleton} from './LoadingSkeleton';
import {t} from '../strings';

interface BookListProps {
  books: Book[];
  isLoading: boolean;
  onSelectBook?: (book: Book) => void;
}

/** FlatList 목록. 로딩/빈 상태 처리. API를 모르고 props로만 동작한다. */
export function BookList({books, isLoading, onSelectBook}: BookListProps) {
  if (isLoading) {
    return (
      <View style={styles.padded}>
        <LoadingSkeleton count={4} />
      </View>
    );
  }

  if (books.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title={t('bookSearch.emptyTitle')}
        description={t('bookSearch.emptyDescription')}
      />
    );
  }

  return (
    <FlatList
      data={books}
      keyExtractor={item => `${item.providerId}-${item.id}`}
      renderItem={({item}) => (
        <BookListItem book={item} onPress={onSelectBook} />
      )}
    />
  );
}

const styles = StyleSheet.create({
  padded: {
    padding: 12,
  },
});
