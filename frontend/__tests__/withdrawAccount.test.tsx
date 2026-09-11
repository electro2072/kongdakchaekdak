import React from 'react';
import {Text} from 'react-native';
import renderer, {act} from 'react-test-renderer';
import {afterEach, beforeEach, describe, expect, it, jest} from '@jest/globals';
import {unlink as kakaoUnlink} from '@react-native-seoul/kakao-login';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import NaverLogin from '@react-native-seoul/naver-login';
import EncryptedStorage from 'react-native-encrypted-storage';
import {AuthProvider, useAuth} from '../src/navigation/AuthContext';
import {ProfileProvider, useProfile} from '../src/navigation/ProfileContext';
import {LibraryProvider, useLibrary} from '../src/navigation/LibraryContext';
import {ToastProvider} from '../src/components/Toast';
import {RootNavigator} from '../src/navigation/RootNavigator';
import {LoginScreen} from '../src/screens/LoginScreen';
import {MainTabs} from '../src/navigation/MainTabs';
import {ProfileScreen} from '../src/screens/ProfileScreen';
import {ApiError, apiFetch} from '../src/services/apiClient';
import {
  SECURE_KEY_ACCESS_TOKEN,
  secureStorage,
} from '../src/services/secureStorage';
import type {SocialProvider} from '../src/types/api/auth';
import {t} from '../src/strings';

// SafeAreaProvider의 네이티브 구현은 jest에서 inset을 받지 못해 자식(NavigationContainer)을 아예
// 렌더하지 않는다. 라이브러리가 공식 제공하는 jest 목으로 이 파일에서만 바꾼다 — 전역 설정을
// 바꾸면 다른 스위트의 렌더 결과가 달라질 수 있어서다.
jest.mock(
  'react-native-safe-area-context',
  () =>
    jest.requireActual<{default: unknown}>(
      'react-native-safe-area-context/jest/mock',
    ).default,
);

/**
 * 회원 탈퇴(G16/S8) 흐름 — AuthContext.withdraw를 실제 Provider 트리 + RootNavigator 위에서 돌린다.
 *
 * 수용기준 중 FE가 책임지는 부분만 검증한다:
 *  - 성공 → 저장된 토큰 삭제 · 캐시(프로필/서재) 비움 · 메인 스택이 사라지고 로그인 화면만 남음
 *  - 실패 → 토큰·로그인 상태·화면 유지, 에러코드 매핑 문구가 담긴 ApiError
 *  - 소셜 연결 해제는 서버 탈퇴 **후**에만 호출되고, 실패해도 탈퇴 성공을 뒤집지 못함
 * JWT 무효화·공유 링크 차단·재가입 플로우(수용기준 2~4)는 서버+실기기 영역이라 테스터 몫이다.
 */

type AuthApi = ReturnType<typeof useAuth>;
type ProfileApi = ReturnType<typeof useProfile>;
type LibraryApi = ReturnType<typeof useLibrary>;

const SAVED_TOKEN = 'saved.jwt.token';
const USER_ID = 7;

function meResponse(socialProvider: string) {
  return {
    id: USER_ID,
    nickname: '책읽는콩이',
    profileImage: null,
    bio: null,
    gender: null,
    socialProvider,
    interests: [],
    createdAt: '2026-09-01T00:00:00',
    updatedAt: '2026-09-01T00:00:00',
    lastLoginAt: null,
    daysSinceLastLogin: null,
  };
}

const BOOK = {
  id: 1,
  userId: USER_ID,
  title: '아몬드',
  author: '손원평',
  coverImage: null,
  isbn: null,
  genre: '소설',
  totalPages: 264,
  status: 'READING',
  startDate: '2026-09-01',
  endDate: null,
  createdAt: '2026-09-01T00:00:00',
  updatedAt: '2026-09-01T00:00:00',
};

type FakeResponse =
  | {ok: boolean; status: number; body?: unknown}
  | 'network-error';

/**
 * 메서드+경로로 응답을 고르는 fetch 목. 부팅 시 여러 화면이 각자 API를 부르므로 순서 기반
 * mockResolvedValueOnce로는 깨지기 쉽다. 정해두지 않은 GET은 404 NOT_FOUND로 돌려 화면이
 * 자기 에러 상태로 빠지게 둔다(이 테스트의 관심사가 아니다).
 */
function mockFetchRoutes(
  deleteResponse: FakeResponse,
  socialProvider: string,
  options: {unauthorizedAfterDelete?: boolean} = {},
) {
  let deleted = false;
  const fetchMock = jest.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET';
    const path = url.replace(/^https?:\/\/[^/]+/, '').split('?')[0];

    let response: FakeResponse;
    if (method === 'DELETE' && path === `/api/users/${USER_ID}`) {
      response = deleteResponse;
      deleted = deleteResponse !== 'network-error' && deleteResponse.ok;
    } else if (deleted && options.unauthorizedAfterDelete) {
      response = {
        ok: false,
        status: 401,
        body: {status: 401, error: 'UNAUTHENTICATED', fieldErrors: []},
      };
    } else if (method === 'GET' && path === '/api/auth/me') {
      response = {ok: true, status: 200, body: meResponse(socialProvider)};
    } else if (method === 'GET' && path === '/api/books') {
      response = {ok: true, status: 200, body: [BOOK]};
    } else {
      response = {
        ok: false,
        status: 404,
        body: {status: 404, error: 'NOT_FOUND', fieldErrors: []},
      };
    }

    if (response === 'network-error') {
      throw new Error('Network request failed');
    }
    const {ok, status, body} = response;
    return {
      ok,
      status,
      text: async () => (status === 204 ? '' : JSON.stringify(body ?? null)),
      json: async () => body ?? null,
    };
  });
  (global as unknown as {fetch: unknown}).fetch = fetchMock;
  return fetchMock;
}

function deleteCalls(fetchMock: ReturnType<typeof mockFetchRoutes>) {
  return fetchMock.mock.calls.filter(
    ([, init]) => (init as RequestInit | undefined)?.method === 'DELETE',
  );
}

function Harness({
  onReady,
}: {
  onReady: (apis: {
    auth: AuthApi;
    profile: ProfileApi;
    library: LibraryApi;
  }) => void;
}) {
  onReady({auth: useAuth(), profile: useProfile(), library: useLibrary()});
  return null;
}

describe('회원 탈퇴 (G16/S8)', () => {
  let activeRoot: renderer.ReactTestRenderer | undefined;

  beforeEach(async () => {
    await secureStorage.setItem(SECURE_KEY_ACCESS_TOKEN, SAVED_TOKEN);
    jest.clearAllMocks();
    // clearAllMocks는 호출 기록만 지우고 mockImplementation은 남긴다 — 앞 테스트에서 reject/보류로
    // 바꾼 SDK 목이 다음 테스트로 새지 않게 구현까지 되돌린다. (원래 구현 없는 jest.fn()이라 안전)
    [kakaoUnlink, GoogleSignin.revokeAccess, NaverLogin.deleteToken].forEach(
      fn => (fn as unknown as jest.Mock).mockReset(),
    );
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    await act(async () => {
      activeRoot?.unmount();
    });
    activeRoot = undefined;
    await secureStorage.removeItem(SECURE_KEY_ACCESS_TOKEN);
    jest.restoreAllMocks();
  });

  /** 저장된 토큰으로 부팅 → /api/auth/me 복원 → 서재 로딩까지 끝난 로그인 상태를 만든다. */
  async function renderLoggedInApp() {
    let apis:
      | {auth: AuthApi; profile: ProfileApi; library: LibraryApi}
      | undefined;
    await act(async () => {
      activeRoot = renderer.create(
        <AuthProvider>
          <ProfileProvider>
            <LibraryProvider>
              <ToastProvider>
                <Harness onReady={value => (apis = value)} />
                <RootNavigator />
              </ToastProvider>
            </LibraryProvider>
          </ProfileProvider>
        </AuthProvider>,
      );
    });
    const root = activeRoot!;
    const get = () => apis!;

    // 전제 확인 — 이게 안 맞으면 아래 검증이 전부 공허하게 통과한다.
    expect(get().auth.isLoggedIn).toBe(true);
    expect(get().profile.userId).toBe(USER_ID);
    expect(get().library.books).toHaveLength(1);
    expect(root.root.findAllByType(MainTabs)).toHaveLength(1);
    expect(root.root.findAllByType(LoginScreen)).toHaveLength(0);
    return {root, get};
  }

  async function runWithdraw(get: () => {auth: AuthApi; profile: ProfileApi}) {
    const {userId, socialProvider} = get().profile;
    let outcome: {error: unknown} = {error: undefined};
    await act(async () => {
      try {
        await get().auth.withdraw({userId: userId!, socialProvider});
      } catch (error) {
        outcome = {error};
      }
    });
    return outcome;
  }

  describe('성공 (204)', () => {
    it('토큰을 지우고 캐시를 비운 뒤 메인 스택을 없애고 로그인 화면으로 돌아간다', async () => {
      const fetchMock = mockFetchRoutes({ok: true, status: 204}, 'kakao');
      const {root, get} = await renderLoggedInApp();

      const {error} = await runWithdraw(get);
      expect(error).toBeUndefined();

      // 계약: DELETE /api/users/{id}, 저장돼 있던 토큰으로 인증, 정확히 한 번
      const calls = deleteCalls(fetchMock);
      expect(calls).toHaveLength(1);
      expect(calls[0][0]).toMatch(new RegExp(`/api/users/${USER_ID}$`));
      expect(
        ((calls[0][1] as RequestInit).headers as Record<string, string>)
          .Authorization,
      ).toBe(`Bearer ${SAVED_TOKEN}`);

      // 토큰: 저장소·메모리 모두
      await expect(
        secureStorage.getItem(SECURE_KEY_ACCESS_TOKEN),
      ).resolves.toBeNull();
      expect(get().auth.isLoggedIn).toBe(false);
      expect(get().auth.accessToken).toBeNull();

      // 캐시: 이전 계정의 프로필·서재가 남지 않는다
      expect(get().profile.userId).toBeNull();
      expect(get().profile.socialProvider).toBeNull();
      expect(get().library.books).toEqual([]);

      // 네비 리셋: 메인 스택이 통째로 언마운트되고 로그인 화면만 남는다(뒤로 갈 곳이 없다)
      expect(root.root.findAllByType(MainTabs)).toHaveLength(0);
      expect(root.root.findAllByType(LoginScreen)).toHaveLength(1);
    });

    it('소셜 연결 해제는 서버 탈퇴가 끝난 뒤에 호출한다', async () => {
      const fetchMock = mockFetchRoutes({ok: true, status: 204}, 'kakao');
      const {get} = await renderLoggedInApp();

      await runWithdraw(get);

      const deleteIndex = fetchMock.mock.calls.findIndex(
        ([, init]) => (init as RequestInit | undefined)?.method === 'DELETE',
      );
      const deleteOrder = fetchMock.mock.invocationCallOrder[deleteIndex];
      const unlinkMock = kakaoUnlink as unknown as jest.Mock;
      expect(unlinkMock).toHaveBeenCalledTimes(1);
      expect(unlinkMock.mock.invocationCallOrder[0]).toBeGreaterThan(
        deleteOrder,
      );
    });
  });

  describe('실패 — 토큰 유지', () => {
    it('403 NOT_OWNER면 매핑 문구로 던지고 토큰·로그인 상태·화면을 그대로 둔다', async () => {
      mockFetchRoutes(
        {
          ok: false,
          status: 403,
          body: {status: 403, error: 'NOT_OWNER', fieldErrors: []},
        },
        'kakao',
      );
      const {root, get} = await renderLoggedInApp();

      const {error} = await runWithdraw(get);

      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).code).toBe('NOT_OWNER');
      expect((error as ApiError).message).toBe(t('apiError.notOwner'));

      await expect(
        secureStorage.getItem(SECURE_KEY_ACCESS_TOKEN),
      ).resolves.toBe(SAVED_TOKEN);
      expect(get().auth.isLoggedIn).toBe(true);
      expect(get().auth.accessToken).toBe(SAVED_TOKEN);
      expect(get().library.books).toHaveLength(1);
      expect(root.root.findAllByType(MainTabs)).toHaveLength(1);
      // 계정이 남아 있으므로 소셜 연결도 건드리지 않는다
      expect(kakaoUnlink).not.toHaveBeenCalled();
    });

    it('네트워크 오류여도 토큰·로그인 상태를 그대로 둔다', async () => {
      mockFetchRoutes('network-error', 'kakao');
      const {get} = await renderLoggedInApp();

      const {error} = await runWithdraw(get);

      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(0);
      await expect(
        secureStorage.getItem(SECURE_KEY_ACCESS_TOKEN),
      ).resolves.toBe(SAVED_TOKEN);
      expect(get().auth.isLoggedIn).toBe(true);
      expect(kakaoUnlink).not.toHaveBeenCalled();
    });
  });

  describe('연결 해제를 기다리는 동안 다른 요청의 401로 로그아웃이 먼저 일어나도', () => {
    /**
     * 시나리오: 서버 탈퇴(204) 직후 백엔드가 JWT를 무효화했고, 연결 해제(카카오 unlink)가 아직
     * 응답하지 않는 사이 다른 화면의 요청이 401을 받는다 → apiClient의 unauthorizedHandler(logout)가
     * withdraw보다 먼저 세션을 정리한다. 그 뒤 연결 해제가 끝나면 withdraw가 같은 정리를 한 번 더 한다.
     *
     * 두 번째 토큰 삭제는 이미 없는 키를 지우는 것이라 iOS(Keychain `SecItemDelete` →
     * errSecItemNotFound)에서는 reject된다. Android(SharedPreferences)는 resolve한다. 더 까다로운
     * iOS 쪽을 재현한다. (in-memory 목은 없는 키도 resolve하므로 명시적으로 한 번 reject시킨다)
     */
    it('이중 정리 오류 없이 로그인 화면에 도달하고 완료 토스트가 뜬다', async () => {
      mockFetchRoutes({ok: true, status: 204}, 'kakao', {
        unauthorizedAfterDelete: true,
      });
      let finishUnlink: () => void = () => {
        throw new Error('연결 해제가 아직 호출되지 않았다');
      };
      (kakaoUnlink as unknown as jest.Mock).mockImplementation(
        () =>
          new Promise<void>(resolve => {
            finishUnlink = resolve;
          }),
      );
      const {root, get} = await renderLoggedInApp();

      // 실제 사용자 경로: 프로필 탭 → 회원 탈퇴 링크 → 다이얼로그 "탈퇴"
      const profileTab = root.root.find(
        node =>
          typeof node.props.onPress === 'function' &&
          typeof node.props.accessibilityLabel === 'string' &&
          node.props.accessibilityLabel.startsWith(
            `${t('nav.tabs.profile')}, tab`,
          ),
      );
      await act(async () => {
        profileTab.props.onPress({preventDefault: () => {}});
      });
      expect(root.root.findAllByType(ProfileScreen)).toHaveLength(1);
      await act(async () => {
        root.root.findByProps({testID: 'withdraw-link'}).props.onPress();
      });
      await act(async () => {
        root.root
          .findByProps({testID: 'confirm-dialog-confirm'})
          .props.onPress();
      });

      // 서버 탈퇴는 끝났고 연결 해제에서 멈춰 있다 — 아직 세션은 살아 있다
      expect(kakaoUnlink).toHaveBeenCalledTimes(1);
      expect(get().auth.isLoggedIn).toBe(true);

      // 다른 요청이 401 → unauthorizedHandler 로그아웃이 먼저 일어난다
      await act(async () => {
        await apiFetch('/api/books').catch(() => {});
      });
      expect(get().auth.isLoggedIn).toBe(false);
      expect(root.root.findAllByType(LoginScreen)).toHaveLength(1);
      expect(root.root.findAllByType(ProfileScreen)).toHaveLength(0);
      await expect(
        secureStorage.getItem(SECURE_KEY_ACCESS_TOKEN),
      ).resolves.toBeNull();

      // withdraw의 두 번째 토큰 삭제는 iOS처럼 "없는 키"로 reject된다
      (
        EncryptedStorage.removeItem as unknown as jest.Mock
      ).mockImplementationOnce(async () => {
        throw new Error('errSecItemNotFound (-25300)');
      });
      await act(async () => {
        finishUnlink();
      });

      // 로그인 화면에 머물고, 완료 토스트가 뜨며, 실패 토스트는 없다
      expect(get().auth.isLoggedIn).toBe(false);
      expect(get().auth.accessToken).toBeNull();
      expect(get().library.books).toEqual([]);
      expect(root.root.findAllByType(LoginScreen)).toHaveLength(1);
      expect(root.root.findAllByType(MainTabs)).toHaveLength(0);
      const texts = root.root
        .findAllByType(Text)
        .map(node => node.props.children);
      expect(texts).toContain(t('profile.withdraw.success'));
      expect(texts).not.toContain(t('apiError.unauthenticated'));
      expect(texts).not.toContain(t('apiError.unknown'));

      // 두 번째 삭제 실패는 삼켜지고 경고로만 남는다 / React 경고(언마운트 후 갱신 등)는 없다
      const warned = (console.warn as unknown as jest.Mock).mock.calls
        .map(args => String(args[0]))
        .join('\n');
      expect(warned).toContain('탈퇴 후 토큰 삭제 실패');
      const reactErrors = (console.error as unknown as jest.Mock).mock.calls
        .map(args => String(args[0]))
        .filter(message =>
          /Warning:|not wrapped in act|unmounted/.test(message),
        );
      expect(reactErrors).toEqual([]);
    });
  });

  describe('소셜 연결 해제 실패는 탈퇴 성공을 막지 않는다', () => {
    const cases: Array<[SocialProvider, () => jest.Mock]> = [
      ['kakao', () => kakaoUnlink as unknown as jest.Mock],
      ['google', () => GoogleSignin.revokeAccess as unknown as jest.Mock],
      ['naver', () => NaverLogin.deleteToken as unknown as jest.Mock],
    ];

    it.each(cases)(
      '%s 연결 해제가 reject해도 토큰 삭제·로그인 화면 복귀까지 끝낸다',
      async (provider, getSdkMock) => {
        mockFetchRoutes({ok: true, status: 204}, provider);
        getSdkMock().mockImplementation(async () => {
          throw new Error(`${provider} unlink failed`);
        });
        const {root, get} = await renderLoggedInApp();
        expect(get().profile.socialProvider).toBe(provider);

        const {error} = await runWithdraw(get);

        expect(error).toBeUndefined();
        expect(getSdkMock()).toHaveBeenCalledTimes(1);
        await expect(
          secureStorage.getItem(SECURE_KEY_ACCESS_TOKEN),
        ).resolves.toBeNull();
        expect(get().auth.isLoggedIn).toBe(false);
        expect(root.root.findAllByType(LoginScreen)).toHaveLength(1);
      },
    );
  });
});
