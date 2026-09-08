import React from 'react';
import {Text} from 'react-native';
import renderer, {act} from 'react-test-renderer';
import {beforeEach, describe, expect, it, jest} from '@jest/globals';

// LibraryContext는 useAuth()/useProfile()에서 로그인 여부와 userId만 읽는다. 실제 Provider를
// 세우면 세션 복원·GET /api/auth/me까지 끌려들어와 이 테스트의 관심사(서재 state 관리)가
// 흐려지므로, 두 훅만 최소한으로 대체한다.
const authState = {isLoggedIn: true};
const profileState: {userId: number | null} = {userId: 7};

jest.mock('../src/navigation/AuthContext', () => ({
  useAuth: () => authState,
}));
jest.mock('../src/navigation/ProfileContext', () => ({
  useProfile: () => profileState,
}));
jest.mock('../src/services/libraryApi', () => ({
  __esModule: true,
  toIsoDate: (date: Date) => date.toISOString().slice(0, 10),
  fetchBooks: jest.fn(),
  createBook: jest.fn(),
  completeBook: jest.fn(),
  fetchNotes: jest.fn(),
  createNote: jest.fn(),
  updateNote: jest.fn(),
  deleteNote: jest.fn(),
  fetchPhotos: jest.fn(),
  uploadPhoto: jest.fn(),
  deletePhoto: jest.fn(),
}));

import {LibraryProvider, useLibrary} from '../src/navigation/LibraryContext';
import * as libraryApi from '../src/services/libraryApi';

const api = libraryApi as jest.Mocked<typeof libraryApi>;

type UseLibraryResult = ReturnType<typeof useLibrary>;

function Harness({onReady}: {onReady: (value: UseLibraryResult) => void}) {
  const value = useLibrary();
  onReady(value);
  return <Text>{value.books.length}</Text>;
}

function BareConsumer() {
  useLibrary();
  return null;
}

function bookResponse(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 1,
    userId: 7,
    title: '아몬드',
    author: '손원평',
    coverImage: 'https://example.com/almond.jpg',
    isbn: null,
    genre: '소설',
    totalPages: null,
    status: 'READING',
    startDate: '2026-06-20',
    endDate: null,
    createdAt: '2026-06-20T09:00:00',
    updatedAt: '2026-06-20T09:00:00',
    ...overrides,
  } as never;
}

/** Provider를 세우고, 마운트 시 도는 목록 조회 effect까지 흘려보낸 뒤 api 핸들을 돌려준다. */
async function mount() {
  let value: UseLibraryResult | undefined;
  let root: renderer.ReactTestRenderer | undefined;
  await act(async () => {
    root = renderer.create(
      <LibraryProvider>
        <Harness onReady={v => (value = v)} />
      </LibraryProvider>,
    );
  });
  return {
    get current() {
      return value as UseLibraryResult;
    },
    unmount: () => root?.unmount(),
  };
}

/**
 * 서재 상태는 등록한 책이 앱을 껐다 켜도 남아 있는지를 좌우하는 지점이라, 로컬 mock에서
 * 실제 API 연동으로 바꾼 뒤 별도로 검증한다. 특히 "실패했는데 화면에는 반영된 것처럼 보이는"
 * 상황을 막기 위해 낙관적 갱신을 쓰지 않기로 한 결정을 테스트로 고정해둔다.
 */
describe('LibraryContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authState.isLoggedIn = true;
    profileState.userId = 7;
    api.fetchBooks.mockResolvedValue([]);
    api.fetchNotes.mockResolvedValue([]);
    api.fetchPhotos.mockResolvedValue([]);
  });

  it('Provider 밖에서 useLibrary를 쓰면 에러를 던진다', () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => {
      act(() => {
        renderer.create(<BareConsumer />);
      });
    }).toThrow('useLibrary는 LibraryProvider 안에서만 사용할 수 있습니다.');

    consoleSpy.mockRestore();
  });

  it('로그인하면 GET /api/books 응답으로 서재를 채운다 — 정적 mock 목록을 쓰지 않는다', async () => {
    api.fetchBooks.mockResolvedValue([
      bookResponse(),
      bookResponse({id: 2, title: '82년생 김지영', status: 'DONE'}),
    ]);

    const harness = await mount();

    expect(api.fetchBooks).toHaveBeenCalledWith(7);
    expect(harness.current.books).toHaveLength(2);
    expect(harness.current.books[0]).toMatchObject({
      id: '1',
      title: '아몬드',
      status: 'reading',
      coverImage: 'https://example.com/almond.jpg',
    });
    // 목록 응답에는 소감·사진이 없으므로 빈 배열로 시작한다.
    expect(harness.current.books[0].notes).toEqual([]);
    expect(harness.current.books[0].photos).toEqual([]);
    harness.unmount();
  });

  it('게스트(userId 없음)면 서버를 호출하지 않고 빈 서재를 보여준다', async () => {
    profileState.userId = null;

    const harness = await mount();

    expect(api.fetchBooks).not.toHaveBeenCalled();
    expect(harness.current.books).toEqual([]);
    harness.unmount();
  });

  it('목록 조회에 실패하면 error를 세우고 서재는 비워둔다', async () => {
    // 실패 경로를 일부러 태우는 테스트라 logger가 콘솔에 찍는 스택은 무시한다.
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    api.fetchBooks.mockRejectedValue(new Error('boom'));

    const harness = await mount();

    expect(harness.current.error).not.toBeNull();
    expect(harness.current.books).toEqual([]);
    expect(harness.current.isLoading).toBe(false);
    harness.unmount();
    consoleSpy.mockRestore();
  });

  it('addBook은 서버가 발급한 id가 담긴 책을 돌려주고 목록 맨 앞에 넣는다', async () => {
    api.fetchBooks.mockResolvedValue([bookResponse({id: 1})]);
    api.createBook.mockResolvedValue(
      bookResponse({id: 99, title: '데미안', author: '헤르만 헤세'}),
    );

    const harness = await mount();

    let created;
    await act(async () => {
      created = await harness.current.addBook({
        title: '데미안',
        author: '헤르만 헤세',
        genre: '소설',
      });
    });

    // 검색 결과의 provider id가 아니라 서버 id여야 상세 화면에서 책을 찾을 수 있다.
    expect(created).toMatchObject({id: '99', title: '데미안'});
    expect(api.createBook).toHaveBeenCalledWith(
      expect.objectContaining({userId: 7, title: '데미안', genre: '소설'}),
    );
    expect(harness.current.books.map(b => b.id)).toEqual(['99', '1']);
    harness.unmount();
  });

  it('로그인하지 않았으면 addBook이 서버를 호출하지 않고 거부한다', async () => {
    profileState.userId = null;
    const harness = await mount();

    await act(async () => {
      await expect(
        harness.current.addBook({
          title: '데미안',
          author: '헤르만 헤세',
          genre: '소설',
        }),
      ).rejects.toThrow('로그인');
    });

    expect(api.createBook).not.toHaveBeenCalled();
    harness.unmount();
  });

  it('loadBookDetail은 소감·사진을 채우고 최신 소감을 맨 앞에 둔다', async () => {
    api.fetchBooks.mockResolvedValue([bookResponse({id: 1})]);
    api.fetchNotes.mockResolvedValue([
      {
        id: 10,
        bookId: 1,
        content: '먼저 쓴 소감',
        createdAt: '2026-06-21T09:00:00',
        updatedAt: '2026-06-21T09:00:00',
      },
      {
        id: 11,
        bookId: 1,
        content: '나중에 쓴 소감',
        createdAt: '2026-06-25T09:00:00',
        updatedAt: '2026-06-25T09:00:00',
      },
    ] as never);
    api.fetchPhotos.mockResolvedValue([
      {
        id: 20,
        bookId: 1,
        imageUrl: 'https://cdn.example.com/p.jpg',
        locationText: '홍대 카페',
        latitude: null,
        longitude: null,
        createdAt: '2026-06-22T09:00:00',
      },
    ] as never);

    const harness = await mount();
    await act(async () => {
      await harness.current.loadBookDetail('1');
    });

    const book = harness.current.books[0];
    expect(book.notes.map(n => n.content)).toEqual([
      '나중에 쓴 소감',
      '먼저 쓴 소감',
    ]);
    expect(book.photos[0]).toMatchObject({
      id: '20',
      uri: 'https://cdn.example.com/p.jpg',
      label: '홍대 카페',
    });
    harness.unmount();
  });

  it('completeBook은 상태를 done으로 바꾸고 읽은 기간 라벨을 다시 만든다', async () => {
    api.fetchBooks.mockResolvedValue([bookResponse({id: 1})]);
    api.completeBook.mockResolvedValue(
      bookResponse({id: 1, status: 'DONE', endDate: '2026-06-28'}),
    );

    const harness = await mount();
    await act(async () => {
      await harness.current.completeBook('1');
    });

    expect(api.completeBook).toHaveBeenCalledWith(1);
    expect(harness.current.books[0]).toMatchObject({
      status: 'done',
      dateRangeLabel: '2026.06.20 ~ 2026.06.28 (9일)',
    });
    harness.unmount();
  });

  it('진행 중인 책은 읽은 기간 라벨이 "~ 진행중"으로 남는다', async () => {
    api.fetchBooks.mockResolvedValue([bookResponse({id: 1})]);
    const harness = await mount();

    expect(harness.current.books[0].dateRangeLabel).toBe('2026.06.20 ~ 진행중');
    harness.unmount();
  });

  it('소감 삭제가 실패하면 목록을 그대로 둔다 — 낙관적 갱신을 쓰지 않는다', async () => {
    api.fetchBooks.mockResolvedValue([bookResponse({id: 1})]);
    api.fetchNotes.mockResolvedValue([
      {
        id: 10,
        bookId: 1,
        content: '지워지면 안 되는 소감',
        createdAt: '2026-06-21T09:00:00',
        updatedAt: '2026-06-21T09:00:00',
      },
    ] as never);
    api.deleteNote.mockRejectedValue(new Error('500'));

    const harness = await mount();
    await act(async () => {
      await harness.current.loadBookDetail('1');
    });
    await act(async () => {
      await expect(harness.current.deleteNote('1', '10')).rejects.toThrow();
    });

    expect(harness.current.books[0].notes).toHaveLength(1);
    harness.unmount();
  });

  it('로그아웃하면 서재를 즉시 비운다 — 다음 계정에 이전 사용자의 책이 보이면 안 된다', async () => {
    api.fetchBooks.mockResolvedValue([bookResponse({id: 1})]);
    let value: UseLibraryResult | undefined;
    let root: renderer.ReactTestRenderer | undefined;
    await act(async () => {
      root = renderer.create(
        <LibraryProvider>
          <Harness onReady={v => (value = v)} />
        </LibraryProvider>,
      );
    });
    expect(value?.books).toHaveLength(1);

    authState.isLoggedIn = false;
    profileState.userId = null;
    await act(async () => {
      root?.update(
        <LibraryProvider>
          <Harness onReady={v => (value = v)} />
        </LibraryProvider>,
      );
    });

    expect(value?.books).toEqual([]);
    root?.unmount();
  });

  it('addNote는 서버 응답을 목록 맨 앞에 넣는다', async () => {
    api.fetchBooks.mockResolvedValue([bookResponse({id: 1})]);
    api.createNote.mockResolvedValue({
      id: 30,
      bookId: 1,
      content: '새 소감',
      createdAt: '2026-06-26T09:00:00',
      updatedAt: '2026-06-26T09:00:00',
    } as never);

    const harness = await mount();
    await act(async () => {
      await harness.current.addNote('1', '새 소감');
    });

    expect(api.createNote).toHaveBeenCalledWith(1, '새 소감');
    expect(harness.current.books[0].notes[0]).toMatchObject({
      id: '30',
      content: '새 소감',
    });
    harness.unmount();
  });
});
