import React, {createContext, useContext, useMemo, useState} from 'react';
import {MOCK_LIBRARY_BOOKS, type LibraryBook} from '../mocks/libraryBooks';

function generateLocalId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface LibraryContextValue {
  books: LibraryBook[];
  addBook: (book: LibraryBook) => void;
  /** 소감 작성 — 책 하나에 여러 개 가능(백엔드 회신 기준), 최신 항목이 배열 맨 앞에 온다 */
  addNote: (bookId: string, content: string) => void;
  updateNote: (bookId: string, noteId: string, content: string) => void;
  deleteNote: (bookId: string, noteId: string) => void;
  /** 장소 사진 추가 — 로컬 이미지 피커가 돌려준 uri를 그대로 저장 */
  addPhoto: (bookId: string, photo: {uri: string; label?: string}) => void;
  deletePhoto: (bookId: string, photoId: string) => void;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

/**
 * 임시 mock 서재 상태. POST /api/books 연동 전이라(Frame 08.2 책 등록 확인 화면 신규 구현과
 * 함께 추가 — 개발현황_v2.md 참고) AuthContext/ProfileContext와 동일한 패턴으로 로컬 state만
 * 관리한다. BookRegisterConfirmScreen에서 등록하면 이 state에 새 책이 추가되고
 * LibraryScreen/BookDetailScreen이 바로 반영해서 보여준다. 앱을 재시작하면 초기화된다(영속화 없음).
 *
 * TODO: 실제 연동 시 초기값을 GET /api/books 응답으로, addBook 내부를 POST /api/books 호출로 교체한다.
 *
 * 2026-09-08 업데이트: 소감(BookNote)·장소사진(BookPhoto) CRUD 추가 — 백엔드 회신
 * (claude/독서기록앱_백엔드요청_프론트_책상세API확인_표지소감사진_v1.md) 기준으로 소감은 책 하나에
 * 여러 개 작성 가능한 목록 구조로 확정됨. addBook과 동일하게 지금은 로컬 state만 바꾸고,
 * TODO: 실제 연동 시 addNote/updateNote/deleteNote 내부를 POST/PATCH/DELETE
 * /api/books/{id}/notes(/{noteId}) 호출로, addPhoto/deletePhoto 내부를 presigned-url 2단계
 * 업로드 + POST/DELETE /api/books/{id}/photos(/{photoId}) 호출로 교체한다.
 */
export function LibraryProvider({children}: {children: React.ReactNode}) {
  const [books, setBooks] = useState<LibraryBook[]>(MOCK_LIBRARY_BOOKS);

  const value = useMemo<LibraryContextValue>(
    () => ({
      books,
      addBook: book => setBooks(prev => [book, ...prev]),
      addNote: (bookId, content) =>
        setBooks(prev =>
          prev.map(b =>
            b.id === bookId
              ? {
                  ...b,
                  notes: [
                    {
                      id: generateLocalId('note'),
                      content,
                      createdAt: new Date().toISOString(),
                    },
                    ...b.notes,
                  ],
                }
              : b,
          ),
        ),
      updateNote: (bookId, noteId, content) =>
        setBooks(prev =>
          prev.map(b =>
            b.id === bookId
              ? {
                  ...b,
                  notes: b.notes.map(n =>
                    n.id === noteId ? {...n, content} : n,
                  ),
                }
              : b,
          ),
        ),
      deleteNote: (bookId, noteId) =>
        setBooks(prev =>
          prev.map(b =>
            b.id === bookId
              ? {...b, notes: b.notes.filter(n => n.id !== noteId)}
              : b,
          ),
        ),
      addPhoto: (bookId, photo) =>
        setBooks(prev =>
          prev.map(b =>
            b.id === bookId
              ? {
                  ...b,
                  photos: [
                    ...b.photos,
                    {
                      id: generateLocalId('photo'),
                      uri: photo.uri,
                      label: photo.label,
                    },
                  ],
                }
              : b,
          ),
        ),
      deletePhoto: (bookId, photoId) =>
        setBooks(prev =>
          prev.map(b =>
            b.id === bookId
              ? {...b, photos: b.photos.filter(p => p.id !== photoId)}
              : b,
          ),
        ),
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
