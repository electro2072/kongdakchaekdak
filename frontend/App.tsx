/**
 * 독서 기록 공유 앱
 * 지금은 Frame 03(독서 기록 작성)의 책 검색 화면만 연결되어 있다.
 */

import React from 'react';
import {StatusBar, useColorScheme} from 'react-native';
import {BookSearchScreen} from './src/screens/BookSearchScreen';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <BookSearchScreen />
    </>
  );
}

export default App;
