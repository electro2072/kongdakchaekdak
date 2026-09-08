import React from 'react';
import {Text} from 'react-native';
import renderer, {act} from 'react-test-renderer';
import {afterEach, describe, expect, it, jest} from '@jest/globals';
import {ProfileScreen} from '../src/screens/ProfileScreen';
import {AuthProvider, useAuth} from '../src/navigation/AuthContext';
import {ProfileProvider, useProfile} from '../src/navigation/ProfileContext';
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
            <AuthHarness onReady={value => (authApi = value)} />
            <ProfileSeeder>
              <ProfileScreen />
            </ProfileSeeder>
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
});
