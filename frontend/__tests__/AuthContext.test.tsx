import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {afterEach, beforeEach, describe, expect, it, jest} from '@jest/globals';
import {AuthProvider, useAuth} from '../src/navigation/AuthContext';
import {
  SECURE_KEY_ACCESS_TOKEN,
  secureStorage,
} from '../src/services/secureStorage';

type UseAuthResult = ReturnType<typeof useAuth>;

function AuthHarness({onReady}: {onReady: (api: UseAuthResult) => void}) {
  onReady(useAuth());
  return null;
}

const SAVED_TOKEN = 'saved.jwt.token';

const ME_RESPONSE = {
  id: 7,
  nickname: '책읽는콩이',
  profileImage: null,
  bio: null,
  gender: null,
  socialProvider: 'kakao',
  interests: [],
  createdAt: '2026-09-01T00:00:00',
  updatedAt: '2026-09-01T00:00:00',
  lastLoginAt: null,
  daysSinceLastLogin: null,
};

/** apiClient는 전역 fetch를 쓴다 — 응답 모양만 흉내 내면 충분하다. */
function mockFetchOnce(response: {
  ok: boolean;
  status: number;
  body?: unknown;
}) {
  const fetchMock = jest.fn(async () => ({
    ok: response.ok,
    status: response.status,
    text: async () => JSON.stringify(response.body ?? null),
    json: async () => response.body ?? null,
  }));
  (global as unknown as {fetch: unknown}).fetch = fetchMock;
  return fetchMock;
}

function mockFetchNetworkError() {
  const fetchMock = jest.fn(async () => {
    throw new Error('Network request failed');
  });
  (global as unknown as {fetch: unknown}).fetch = fetchMock;
  return fetchMock;
}

async function renderAuth() {
  let api: UseAuthResult | undefined;
  let root: renderer.ReactTestRenderer | undefined;
  await act(async () => {
    root = renderer.create(
      <AuthProvider>
        <AuthHarness onReady={value => (api = value)} />
      </AuthProvider>,
    );
  });
  return {root: root!, getApi: () => api!};
}

/**
 * 세션 영속화(연동매트릭스 §2.1 #5 / 릴리스 게이트 G3).
 *
 * 테스터의 실기기 판정("로그인 → 강제종료 → 재실행 → 로그인 유지")이 최종 관문이지만,
 * 그 판정이 성립하려면 아래 4가지 분기가 먼저 맞아야 한다. 특히 401과 네트워크 오류를
 * 구분하는 부분은 실기기에서 재현시키기 번거로워서 여기서 확실히 눌러둔다.
 */
describe('AuthContext 세션 복원', () => {
  let activeRoot: renderer.ReactTestRenderer | undefined;

  beforeEach(async () => {
    // 목 저장소가 테스트 간에 유지되므로 매번 비운다.
    await secureStorage.removeItem(SECURE_KEY_ACCESS_TOKEN);
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    // 401/네트워크 실패 케이스는 logger가 error로 남기는 게 정상 동작이라, 출력만 죽인다.
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    activeRoot?.unmount();
    activeRoot = undefined;
    jest.restoreAllMocks();
  });

  it('저장된 토큰이 없으면 로그인 화면으로 두고 /api/auth/me도 부르지 않는다', async () => {
    const fetchMock = mockFetchOnce({ok: true, status: 200, body: ME_RESPONSE});

    const {root, getApi} = await renderAuth();
    activeRoot = root;

    expect(getApi().isRestoring).toBe(false);
    expect(getApi().isLoggedIn).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('저장된 토큰이 살아 있으면 Bearer로 검증하고 로그인 상태를 복원한다', async () => {
    await secureStorage.setItem(SECURE_KEY_ACCESS_TOKEN, SAVED_TOKEN);
    const fetchMock = mockFetchOnce({ok: true, status: 200, body: ME_RESPONSE});

    const {root, getApi} = await renderAuth();
    activeRoot = root;

    expect(getApi().isLoggedIn).toBe(true);
    expect(getApi().accessToken).toBe(SAVED_TOKEN);
    // ProfileProvider가 같은 요청을 또 보내지 않도록 검증 응답을 들고 있어야 한다.
    expect(getApi().sessionUser?.id).toBe(ME_RESPONSE.id);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      {headers: Record<string, string>},
    ];
    expect(url).toContain('/api/auth/me');
    expect(init.headers.Authorization).toBe(`Bearer ${SAVED_TOKEN}`);
  });

  it('저장된 토큰이 만료(401)면 폐기하고 로그인 화면으로 보낸다', async () => {
    await secureStorage.setItem(SECURE_KEY_ACCESS_TOKEN, SAVED_TOKEN);
    mockFetchOnce({
      ok: false,
      status: 401,
      body: {message: '인증이 필요합니다.'},
    });

    const {root, getApi} = await renderAuth();
    activeRoot = root;

    expect(getApi().isLoggedIn).toBe(false);
    expect(getApi().accessToken).toBeNull();
    // 다음 실행에서 죽은 토큰으로 또 시도하지 않도록 저장소에서도 지워져야 한다.
    expect(await secureStorage.getItem(SECURE_KEY_ACCESS_TOKEN)).toBeNull();
  });

  it('서버에 닿지 못한 것뿐이면 토큰을 지우지 않고 세션을 유지한다', async () => {
    await secureStorage.setItem(SECURE_KEY_ACCESS_TOKEN, SAVED_TOKEN);
    mockFetchNetworkError();

    const {root, getApi} = await renderAuth();
    activeRoot = root;

    // 지하철·서버 재시작 때문에 로그아웃시키면 안 된다. 토큰이 실제로 죽었다면
    // 이후 첫 API 호출의 401에서 정리된다.
    expect(getApi().isLoggedIn).toBe(true);
    expect(await secureStorage.getItem(SECURE_KEY_ACCESS_TOKEN)).toBe(
      SAVED_TOKEN,
    );
  });

  it('로그아웃하면 저장된 토큰까지 지운다', async () => {
    await secureStorage.setItem(SECURE_KEY_ACCESS_TOKEN, SAVED_TOKEN);
    mockFetchOnce({ok: true, status: 200, body: ME_RESPONSE});

    const {root, getApi} = await renderAuth();
    activeRoot = root;
    expect(getApi().isLoggedIn).toBe(true);

    await act(async () => {
      getApi().logout();
    });

    expect(getApi().isLoggedIn).toBe(false);
    expect(await secureStorage.getItem(SECURE_KEY_ACCESS_TOKEN)).toBeNull();
  });
});
