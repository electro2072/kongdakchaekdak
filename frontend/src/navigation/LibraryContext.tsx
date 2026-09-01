import React, {createContext, useContext, useMemo, useState} from 'react';
import {MOCK_LIBRARY_BOOKS, type LibraryBook} from '../mocks/libraryBooks';

interface LibraryContextValue {
  books: LibraryBook[];
  addBook: (book: LibraryBook) => void;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

/**
 * 임시 mock 서재 상태. POST /api/books 연동 전이라(Frame 08.2 책 등록 확인 화면 신규 구현과
 * 함께 추가 — 개발현황_v2.md 참고) AuthContext/ProfileContext와 동일한 패턴으로 로컬 state만
 * 관리한다. BookRegisterConfirmScreen에서 등록하면 이 state에 새 책이 추가되고
 * LibraryScreen/BookDetailScreen이 바로 반영해서 보여준다. 앱을 재시작하면 초기화된다(영속화 없음).
 *
 * TODO: 실제 연동 시 초기값을 GET /api/books 응답으로, addBook 내부를 POST /api/books 호출로 교체한다.
 */
export function LibraryProvider({children}: {children: React.ReactNode}) {
  const [books, setBooks] = useState<LibraryBook[]>(MOCK_LIBRARY_BOOKS);

  const value = useMemo<LibraryContextValue>(
    () => ({
      books,
      addBook: book => setBooks(prev => [book, ...prev]),
    }),
    [books],
  );

  return (
    <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
  );
}

export function useLibrary(): LibraryContextValue {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary는 LibraryProvider 안에서만 사용할 수 있습니다.');
  }
  return context;
}
