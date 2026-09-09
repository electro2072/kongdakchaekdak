import React, {useState} from 'react';
import {View, TextInput, Button, StyleSheet} from 'react-native';
import {t} from '../strings';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

/** 검색어 입력창 + 검색 버튼. API를 모르고 props로만 동작한다. */
export function SearchBar({onSearch, isLoading}: SearchBarProps) {
  const [query, setQuery] = useState('');

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={t('bookSearch.placeholder')}
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={() => onSearch(query)}
        returnKeyType="search"
        autoCorrect={false}
        spellCheck={false}
        textBreakStrategy="simple"
      />
      <Button
        title={t('common.search')}
        onPress={() => onSearch(query)}
        disabled={isLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
