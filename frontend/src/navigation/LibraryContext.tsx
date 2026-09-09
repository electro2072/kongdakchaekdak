import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type {
  LibraryBook,
  LibraryNote,
  LibraryPhoto,
} from '../mocks/libraryBooks';
import type {Genre} from '../constants/profileOptions';
import {logger} from '../utils/logger';
import {useAuth} from './AuthContext';
import {t} from '../strings';
import {useProfile} from './ProfileContext';
import * as libraryApi from '../services/libraryApi';
import type {
  BookNoteResponse,
  BookPhotoResponse,
  BookResponse,
} from '../services/libraryApi';

/**
 * 서재 상태 — GET/POST /api/books 및 소감·장소사진 API 실연동.
 *
 * 이전 버전은 MOCK_LIBRARY_BOOKS로 시작하는 로컬 state뿐이라 등록한 책이 앱을 끄면 사라졌다.
 * 이제 로그인(userId 확보) 시점에 서버 목록을 받아오고, 모든 변경은 API를 먼저 호출한 뒤
 * 그 응답으로 state를 갱신한다(낙관적 갱신을 쓰지 않으므로 실패하면 화면이 어긋나지 않는다).
 *
 * 목록 조회(GET /api/books)는 소감·장소사진을 함께 주지 않는다. 그래서 책 상세를 열 때
 * loadBookDetail(bookId)로 notes/photos를 따로 채운다 — 서재 목록에서 N권만큼 추가 요청을
 * 보내지 않기 위한 절충이다.
 */

interface LibraryContextValue {
  books: LibraryBook[];
  /** 최초 목록 로딩 중. 서재 화면이 스켈레톤을 띄우는 데 쓴다. */
  isLoading: boolean;
  /** 목록 조회 실패 메시지. null이면 정상. */
  error: string | null;
  refresh: () => Promise<void>;
  /** 등록 성공 시 서버가 매긴 id가 담긴 책을 돌려준다 — 호출부는 이 id로 상세 화면에 이동해야 한다. */
  addBook: (input: NewBookInput) => Promise<LibraryBook>;
  /** 책 상세 진입 시 호출 — 소감·장소사진을 채운다. 이미 채워져 있으면 조용히 다시 받아 갱신한다. */
  loadBookDetail: (bookId: string) => Promise<void>;
  completeBook: (bookId: string) => Promise<void>;
  addNote: (bookId: string, content: string) => Promise<void>;
  updateNote: (
    bookId: string,
    noteId: string,
    content: string,
  ) => Promise<void>;
  deleteNote: (bookId: string, noteId: string) => Promise<void>;
  addPhoto: (
    bookId: string,
    photo: {uri: string; label?: string},
  ) => Promise<void>;
  deletePhoto: (bookId: string, photoId: string) => Promise<void>;
}

export interface NewBookInput {
  title: string;
  author: string;
  genre: Genre;
  coverImage?: string;
  isbn?: string;
  totalPages?: number;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

function formatDot(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${y}.${m}.${d}`;
}

/** 서재 카드/상세에 쓰는 "읽은 기간" 라벨. 완독이면 일수까지, 진행 중이면 "~ 진행중". */
function buildDateRangeLabel(book: BookResponse): string {
  if (!book.startDate) {
    return book.status === 'DONE' ? '완독' : '진행중';
  }
  const start = formatDot(book.startDate);
  if (book.status !== 'DONE' || !book.endDate) {
    return `${start} ~ 진행중`;
  }
  const days =
    Math.round(
      (new Date(book.endDate).getTime() - new Date(book.startDate).getTime()) /
        86_400_000,
    ) + 1;
  return `${start} ~ ${formatDot(book.endDate)} (${days}일)`;
}

function mapNote(note: BookNoteResponse): LibraryNote {
  return {
    id: String(note.id),
    content: note.content,
    createdAt: note.createdAt,
  };
}

function mapPhoto(photo: BookPhotoResponse): LibraryPhoto {
  return {
    id: String(photo.id),
    uri: photo.imageUrl,
    label: photo.locationText ?? undefined,
  };
}

/**
 * BookResponse → LibraryBook. notes/photos는 목록 응답에 없으므로 기존에 들고 있던 값을
 * 넘겨받아 유지한다(상세를 한 번 연 책이 목록 새로고침으로 소감을 잃지 않도록).
 */
function mapBook(
  book: BookResponse,
  previous?: Pick<LibraryBook, 'notes' | 'photos'>,
): LibraryBook {
  return {
    id: String(book.id),
    title: book.title,
    author: book.author,
    status: book.status === 'DONE' ? 'done' : 'reading',
    dateRangeLabel: buildDateRangeLabel(book),
    coverImage: book.coverImage ?? undefined,
    genre: (book.genre ?? '소설') as Genre,
    notes: previous?.notes ?? [],
    photos: previous?.photos ?? [],
  };
}

export function LibraryProvider({children}: {children: React.ReactNode}) {
  const {isLoggedIn} = useAuth();
  const {userId} = useProfile();
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const patchBook = useCallback(
    (bookId: string, patch: (book: LibraryBook) => LibraryBook) => {
      setBooks(prev => prev.map(b => (b.id === bookId ? patch(b) : b)));
    },
    [],
  );

  const refresh = useCallback(async () => {
    if (userId === null) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await libraryApi.fetchBooks(userId);
      setBooks(prev =>
        response.map(book =>
          mapBook(
            book,
            prev.find(p => p.id === String(book.id)),
          ),
        ),
      );
    } catch (e) {
      logger.error('LibraryContext', '서재 목록 조회 실패', {error: e});
      setError(t('failure.library'));
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // userId가 잡히면(= 실제 계정으로 /api/auth/me를 받아본 뒤) 목록을 채운다.
  // 로그아웃하면 다음 계정의 서재가 잠깐 보이지 않도록 즉시 비운다.
  useEffect(() => {
    if (isLoggedIn && userId !== null) {
      refresh();
    } else if (!isLoggedIn) {
      setBooks([]);
      setError(null);
    }
  }, [isLoggedIn, userId, refresh]);

  const addBook = useCallback(
    async (input: NewBookInput): Promise<LibraryBook> => {
      if (userId === null) {
        throw new Error(t('failure.loginRequiredToAddBook'));
      }
      const created = await libraryApi.createBook({
        userId,
        title: input.title,
        author: input.author,
        genre: input.genre,
        coverImage: input.coverImage,
        isbn: input.isbn,
        totalPages: input.totalPages,
        startDate: libraryApi.toIsoDate(new Date()),
      });
      const mapped = mapBook(created);
      setBooks(prev => [mapped, ...prev]);
      return mapped;
    },
    [userId],
  );

  const loadBookDetail = useCallback(
    async (bookId: string) => {
      const numericId = Number(bookId);
      const [notes, photos] = await Promise.all([
        libraryApi.fetchNotes(numericId),
        libraryApi.fetchPhotos(numericId),
      ]);
      patchBook(bookId, book => ({
        ...book,
        // 최신 소감이 위에 오도록 뒤집는다(목록 UI 규칙).
        notes: notes.map(mapNote).reverse(),
        photos: photos.map(mapPhoto),
      }));
    },
    [patchBook],
  );

  const completeBook = useCallback(
    async (bookId: string) => {
      const updated = await libraryApi.completeBook(Number(bookId));
      patchBook(bookId, book => ({
        ...mapBook(updated, book),
      }));
    },
    [patchBook],
  );

  const addNote = useCallback(
    async (bookId: string, content: string) => {
      const created = await libraryApi.createNote(Number(bookId), content);
      patchBook(bookId, book => ({
        ...book,
        notes: [mapNote(created), ...book.notes],
      }));
    },
    [patchBook],
  );

  const updateNote = useCallback(
    async (bookId: string, noteId: string, content: string) => {
      const updated = await libraryApi.updateNote(
        Number(bookId),
        Number(noteId),
        content,
      );
      patchBook(bookId, book => ({
        ...book,
        notes: book.notes.map(n => (n.id === noteId ? mapNote(updated) : n)),
      }));
    },
    [patchBook],
  );

  const deleteNote = useCallback(
    async (bookId: string, noteId: string) => {
      await libraryApi.deleteNote(Number(bookId), Number(noteId));
      patchBook(bookId, book => ({
        ...book,
        notes: book.notes.filter(n => n.id !== noteId),
      }));
    },
    [patchBook],
  );

  const addPhoto = useCallback(
    async (bookId: string, photo: {uri: string; label?: string}) => {
      const created = await libraryApi.uploadPhoto(
        Number(bookId),
        photo.uri,
        photo.label,
      );
      patchBook(bookId, book => ({
        ...book,
        photos: [...book.photos, mapPhoto(created)],
      }));
    },
    [patchBook],
  );

  const deletePhoto = useCallback(
    async (bookId: string, photoId: string) => {
      await libraryApi.deletePhoto(Number(bookId), Number(photoId));
      patchBook(bookId, book => ({
        ...book,
        photos: book.photos.filter(p => p.id !== photoId),
      }));
    },
    [patchBook],
  );

  const value = useMemo<LibraryContextValue>(
    () => ({
      books,
      isLoading,
      error,
      refresh,
      addBook,
      loadBookDetail,
      completeBook,
      addNote,
      updateNote,
      deleteNote,
      addPhoto,
      deletePhoto,
    }),
    [
      books,
      isLoading,
      error,
      refresh,
      addBook,
      loadBookDetail,
      completeBook,
      addNote,
      updateNote,
      deleteNote,
      addPhoto,
      deletePhoto,
    ],
  );

  return (
    <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
  );
}

export function useLibrary(): LibraryContextValue {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error(t('developer.libraryOutsideProvider'));
  }
  return context;
}
