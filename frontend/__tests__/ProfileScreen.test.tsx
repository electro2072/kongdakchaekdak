import React from 'react';
import {Text} from 'react-native';
import renderer, {act} from 'react-test-renderer';
import {afterEach, beforeEach, describe, expect, it, jest} from '@jest/globals';
import {ProfileScreen} from '../src/screens/ProfileScreen';
import {AuthProvider, useAuth} from '../src/navigation/AuthContext';
import {ProfileProvider, useProfile} from '../src/navigation/ProfileContext';
import {ToastProvider} from '../src/components/Toast';
import {ConfirmDialog} from '../src/components/ConfirmDialog';
import {
  SECURE_KEY_ACCESS_TOKEN,
  secureStorage,
} from '../src/services/secureStorage';
import {t} from '../src/strings';
import type {ProfileSummary} from '../src/types/profile';

type UseAuthResult = ReturnType<typeof useAuth>;

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  // 테스터 리포트 BUG-20260827-02: jest.requireActual()의 반환 타입은 기본적으로 unknown이라
  // 스프레드({...actual})가 TS2698로 깨진다. jest 런타임(babel)은 타입을 무시해 테스트 자체는
  // 통과했지만 `tsc --noEmit`이 실패했음 — 제네릭으로 실제 모듈 타입을 지정해서 해소한다.
  const actual = jest.requireActual<typeof import('@react-navigation/native')>(
    '@react-navigation/native',
  );
  return {
    ...actual,
    useNavigation: () => ({navigate: mockNavigate}),
  };
});

/**
 * 프로필 시드 — 예전엔 ProfileContext 초기값이 `mocks/profile.ts`의 MOCK_PROFILE이라 화면이
 * 곧바로 값을 갖고 렌더됐지만, 이제 초기값이 빈 프로필이고 실제 값은 GET /api/auth/me로 온다.
 * 테스트에서 네트워크를 태울 이유는 없으므로, 게스트 경로(userId === null이면 로컬 state만
 * 갱신하고 API는 부르지 않는다)를 이용해 값을 심어두고 그 뒤에 화면을 마운트한다.
 * 화면들이 `useState(profile.nickname)`으로 초기값을 잡기 때문에 심는 순서가 중요하다.
 */
const TEST_PROFILE: Pick<
  ProfileSummary,
  'nickname' | 'bio' | 'gender' | 'interests'
> = {
  nickname: '책읽는콩이',
  bio: '한 달에 3권 읽기가 목표예요 📚',
  gender: null,
  interests: ['소설', '자기계발', '과학'],
};

function ProfileSeeder({children}: {children: React.ReactNode}) {
  const {updateProfile} = useProfile();
  const [seeded, setSeeded] = React.useState(false);
  React.useEffect(() => {
    updateProfile(TEST_PROFILE).then(() => setSeeded(true));
    // 마운트 시 1회만 심는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <>{seeded ? children : null}</>;
}

/** 화면 밖에서 로그인 상태를 직접 조작/관찰하기 위한 테스트 전용 하네스 (AuthContext.tsx 참고) */
function AuthHarness({onReady}: {onReady: (api: UseAuthResult) => void}) {
  const api = useAuth();
  onReady(api);
  return null;
}

/**
 * `AuthProvider`가 마운트 시 저장소에서 세션을 복원하는 비동기 effect를 갖고 있어
 * (`isRestoring` → false), 렌더링을 `await act(async () => {...})`로 감싸야 "not wrapped in act"
 * 경고 없이 그 상태 업데이트까지 안정적으로 흘려보낼 수 있다.
 */
describe('ProfileScreen', () => {
  let activeRoot: renderer.ReactTestRenderer | undefined;

  afterEach(() => {
    // TouchableOpacity 내부 press 애니메이션이 언마운트 없이 남으면 테스트 종료 후에도
    // 타이머가 돌아 "Cannot log after tests are done" 경고가 난다.
    activeRoot?.unmount();
    activeRoot = undefined;
    mockNavigate.mockClear();
  });

  async function renderScreen() {
    let authApi: UseAuthResult | undefined;
    await act(async () => {
      activeRoot = renderer.create(
        <AuthProvider>
          <ProfileProvider>
            {/* G16(회원 탈퇴)부터 ProfileScreen이 useToast()로 결과를 알린다 — App.tsx와 같은 위치 */}
            <ToastProvider>
              <AuthHarness onReady={value => (authApi = value)} />
              <ProfileSeeder>
                <ProfileScreen />
              </ProfileSeeder>
            </ToastProvider>
          </ProfileProvider>
        </AuthProvider>,
      );
    });
    return {root: activeRoot!, getAuthApi: () => authApi!};
  }

  it('ProfileContext의 닉네임/한줄소개를 보여준다', async () => {
    const {root} = await renderScreen();
    const texts = root.root
      .findAllByType(Text)
      .map(node => node.props.children);

    expect(texts).toContain(TEST_PROFILE.nickname);
    expect(texts).toContain(TEST_PROFILE.bio);
  });

  it('"프로필 편집"을 누르면 ProfileEdit으로 이동한다', async () => {
    const {root} = await renderScreen();
    const editButton = root.root.findByProps({testID: 'edit-profile-button'});

    act(() => {
      editButton.props.onPress();
    });

    expect(mockNavigate).toHaveBeenCalledWith('ProfileEdit');
  });

  it('"이번 분기 리캡 보기" 카드를 누르면 Dashboard로 이동한다', async () => {
    const {root} = await renderScreen();
    const dashboardCard = root.root.findByProps({testID: 'dashboard-card'});

    act(() => {
      dashboardCard.props.onPress();
    });

    expect(mockNavigate).toHaveBeenCalledWith('Dashboard');
  });

  it('"로그아웃"을 누르면 AuthContext의 isLoggedIn이 false가 된다', async () => {
    const {root, getAuthApi} = await renderScreen();

    act(() => {
      getAuthApi().login();
    });
    expect(getAuthApi().isLoggedIn).toBe(true);

    const logoutButton = root.root.findByProps({testID: 'logout-button'});
    act(() => {
      logoutButton.props.onPress();
    });

    expect(getAuthApi().isLoggedIn).toBe(false);
  });

  it('회원 탈퇴 — userId를 아직 모르면(/api/auth/me 전) DELETE를 보내지 않고 안내만 한다', async () => {
    // 이 하네스는 로그인 없이 ProfileSeeder로 값만 심으므로 userId가 null이다.
    const fetchMock = jest.fn(async () => {
      throw new Error('이 테스트에서는 네트워크를 타면 안 된다');
    });
    (global as unknown as {fetch: unknown}).fetch = fetchMock;
    jest.spyOn(console, 'log').mockImplementation(() => {});

    const {root} = await renderScreen();
    await act(async () => {
      root.root.findByProps({testID: 'withdraw-link'}).props.onPress();
    });
    await act(async () => {
      root.root.findByProps({testID: 'confirm-dialog-confirm'}).props.onPress();
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(root.root.findByType(ConfirmDialog).props.visible).toBe(false);
    expect(textsOf(root)).toContain(t('failure.profile'));
    jest.restoreAllMocks();
  });
});

/** 트리에 렌더된 문자열 전부 — 토스트·다이얼로그 문구 확인용 */
function textsOf(root: renderer.ReactTestRenderer): unknown[] {
  return root.root.findAllByType(Text).map(node => node.props.children);
}

/**
 * 회원 탈퇴 UI (G16/S8, Frame 05.5·05.6).
 *
 * 탈퇴 흐름 자체(토큰 삭제·스택 리셋·연결 해제 순서)는 withdrawAccount.test.tsx가 RootNavigator 위에서
 * 본다. 여기서는 화면이 책임지는 것만 누른다 — 다이얼로그 문구, 연타 방지, 실패 표시와 재시도 가능 상태.
 * userId가 있어야 하므로 위 게스트 하네스 대신 저장된 토큰 + /api/auth/me로 실제 로그인 상태를 만든다.
 */
describe('ProfileScreen 회원 탈퇴', () => {
  const SAVED_TOKEN = 'saved.jwt.token';
  const USER_ID = 7;
  let activeRoot: renderer.ReactTestRenderer | undefined;

  type FakeResponse = {ok: boolean; status: number; body?: unknown};

  /** DELETE 응답을 테스트가 원하는 시점에 풀 수 있게 보류해 두는 fetch 목 */
  function mockFetch() {
    const pendingDeletes: Array<(response: FakeResponse) => void> = [];
    const toFetchResponse = ({ok, status, body}: FakeResponse) => ({
      ok,
      status,
      text: async () => (status === 204 ? '' : JSON.stringify(body ?? null)),
      json: async () => body ?? null,
    });
    const fetchMock = jest.fn(async (url: string, init?: RequestInit) => {
      const path = url.replace(/^https?:\/\/[^/]+/, '').split('?')[0];
      if (init?.method === 'DELETE') {
        return new Promise(resolve => {
          pendingDeletes.push(response => resolve(toFetchResponse(response)));
        });
      }
      if (path === '/api/auth/me') {
        return toFetchResponse({
          ok: true,
          status: 200,
          body: {
            id: USER_ID,
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
          },
        });
      }
      // 프로필 통계(/api/books·/api/share-records) — 이 테스트의 관심사가 아니다
      return toFetchResponse({ok: true, status: 200, body: []});
    });
    (global as unknown as {fetch: unknown}).fetch = fetchMock;

    const deleteCallCount = () =>
      fetchMock.mock.calls.filter(
        ([, init]) => (init as RequestInit | undefined)?.method === 'DELETE',
      ).length;
    /** 가장 오래 보류 중인 DELETE를 주어진 응답으로 푼다 */
    const respondToDelete = async (response: FakeResponse) => {
      const resolve = pendingDeletes.shift();
      if (!resolve) {
        throw new Error('보류 중인 DELETE가 없다');
      }
      await act(async () => {
        resolve(response);
      });
    };
    return {deleteCallCount, respondToDelete};
  }

  beforeEach(async () => {
    await secureStorage.setItem(SECURE_KEY_ACCESS_TOKEN, SAVED_TOKEN);
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    // 실패 케이스는 apiClient가 logger.error로 남기는 게 정상 — 출력만 죽인다.
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

  async function renderLoggedIn() {
    let authApi: UseAuthResult | undefined;
    let profileUserId: number | null = null;
    function ProfileProbe() {
      profileUserId = useProfile().userId;
      return null;
    }
    await act(async () => {
      activeRoot = renderer.create(
        <AuthProvider>
          <ProfileProvider>
            <ToastProvider>
              <AuthHarness onReady={value => (authApi = value)} />
              <ProfileProbe />
              <ProfileScreen />
            </ToastProvider>
          </ProfileProvider>
        </AuthProvider>,
      );
    });
    const root = activeRoot!;
    // 전제: 실제 로그인 상태이고 userId가 잡혀 있다 — 아니면 아래 검증이 공허하다
    expect(authApi!.isLoggedIn).toBe(true);
    expect(profileUserId).toBe(USER_ID);

    const link = () => root.root.findByProps({testID: 'withdraw-link'});
    const openDialog = async () => {
      await act(async () => {
        link().props.onPress();
      });
    };
    const confirmButton = () =>
      root.root.findByProps({testID: 'confirm-dialog-confirm'});
    return {root, link, openDialog, confirmButton, getAuthApi: () => authApi!};
  }

  it('링크를 누르면 확정 문구(제목 + 본문 2행)로 확인 다이얼로그를 띄운다', async () => {
    mockFetch();
    const {root, openDialog} = await renderLoggedIn();

    expect(root.root.findByType(ConfirmDialog).props.visible).toBe(false);
    await openDialog();

    const dialog = root.root.findByType(ConfirmDialog);
    expect(dialog.props.visible).toBe(true);
    expect(dialog.props.danger).toBe(true);
    // 문구는 목업 v1.21 Frame 05.5 + 2026-09-11 확정안 그대로여야 한다(삭제 고지 자리라 임의 변경 금지).
    // 2행은 그룹 API 미연동이라 조건 없이 항상 붙는다.
    const texts = textsOf(root);
    expect(texts).toContain('정말 탈퇴하시겠어요?');
    expect(texts).toContain(
      '서재·독서 기록·사진·공유 링크가 모두 삭제되며 복구할 수 없어요.\n' +
        '모임장을 맡은 모임은 가장 먼저 가입한 멤버에게 넘어가고, 혼자인 모임은 삭제돼요.',
    );
    expect(texts).toContain('취소');
    expect(texts).toContain('탈퇴');
  });

  it('"탈퇴"를 연타해도 DELETE는 한 번만 나가고, 요청 중에는 링크가 비활성화된다', async () => {
    const {deleteCallCount, respondToDelete} = mockFetch();
    const {root, link, openDialog, confirmButton} = await renderLoggedIn();

    await openDialog();
    const confirm = confirmButton();
    // 리렌더 전에 두 번 — 실제 빠른 연타와 같은 조건
    await act(async () => {
      confirm.props.onPress();
      confirm.props.onPress();
    });

    expect(deleteCallCount()).toBe(1);
    expect(link().props.disabled).toBe(true);

    await respondToDelete({ok: true, status: 204});

    expect(deleteCallCount()).toBe(1);
    expect(textsOf(root)).toContain(t('profile.withdraw.success'));
  });

  it('실패하면 에러코드 매핑 문구를 토스트로 보여주고, 링크를 다시 살려 재시도할 수 있게 한다', async () => {
    const {deleteCallCount, respondToDelete} = mockFetch();
    const {root, link, openDialog, confirmButton, getAuthApi} =
      await renderLoggedIn();

    await openDialog();
    await act(async () => {
      confirmButton().props.onPress();
    });
    await respondToDelete({
      ok: false,
      status: 403,
      body: {status: 403, error: 'NOT_OWNER', fieldErrors: []},
    });

    const texts = textsOf(root);
    expect(texts).toContain(t('apiError.notOwner'));
    expect(texts).not.toContain(t('profile.withdraw.success'));
    expect(root.root.findByType(ConfirmDialog).props.visible).toBe(false);
    expect(link().props.disabled).toBe(false);
    // 실패 = 세션 유지
    expect(getAuthApi().isLoggedIn).toBe(true);
    await expect(secureStorage.getItem(SECURE_KEY_ACCESS_TOKEN)).resolves.toBe(
      SAVED_TOKEN,
    );

    // 재시도가 실제로 요청을 보낸다 — 연타 방지 잠금이 풀렸는지까지 확인
    await openDialog();
    await act(async () => {
      confirmButton().props.onPress();
    });
    expect(deleteCallCount()).toBe(2);
  });
});
