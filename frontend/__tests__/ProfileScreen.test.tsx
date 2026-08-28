import React from 'react';
import {Text} from 'react-native';
import renderer, {act} from 'react-test-renderer';
import {afterEach, describe, expect, it, jest} from '@jest/globals';
import {ProfileScreen} from '../src/screens/ProfileScreen';
import {AuthProvider, useAuth} from '../src/navigation/AuthContext';
import {ProfileProvider} from '../src/navigation/ProfileContext';
import {MOCK_PROFILE} from '../src/mocks/profile';

type UseAuthResult = ReturnType<typeof useAuth>;

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  // 테스터 리포트 BUG-20260827-02: jest.requireActual()의 반환 타입은 기본적으로 unknown이라
  // 스프레드({...actual})가 TS2698로 깨진다. jest 런타임(babel)은 타입을 무시해 테스트 자체는
  // 통과했지만 `tsc --noEmit`이 실패했음 — 제네릭으로 실제 모듈 타입을 지정해서 해소한다.
  const actual =
    jest.requireActual<typeof import('@react-navigation/native')>(
      '@react-navigation/native',
    );
  return {
    ...actual,
    useNavigation: () => ({navigate: mockNavigate}),
  };
});

/** 화면 밖에서 로그인 상태를 직접 조작/관찰하기 위한 테스트 전용 하네스 (AuthContext.tsx 참고) */
function AuthHarness({onReady}: {onReady: (api: UseAuthResult) => void}) {
  const api = useAuth();
  onReady(api);
  return null;
}

describe('ProfileScreen', () => {
  let activeRoot: renderer.ReactTestRenderer | undefined;

  afterEach(() => {
    // TouchableOpacity 내부 press 애니메이션이 언마운트 없이 남으면 테스트 종료 후에도
    // 타이머가 돌아 "Cannot log after tests are done" 경고가 난다.
    activeRoot?.unmount();
    activeRoot = undefined;
    mockNavigate.mockClear();
  });

  function renderScreen() {
    let authApi: UseAuthResult | undefined;
    act(() => {
      activeRoot = renderer.create(
        <AuthProvider>
          <ProfileProvider>
            <AuthHarness onReady={value => (authApi = value)} />
            <ProfileScreen />
          </ProfileProvider>
        </AuthProvider>,
      );
    });
    return {root: activeRoot!, getAuthApi: () => authApi!};
  }

  it('ProfileContext의 닉네임/한줄소개를 보여준다', () => {
    const {root} = renderScreen();
    const texts = root.root
      .findAllByType(Text)
      .map(node => node.props.children);

    expect(texts).toContain(MOCK_PROFILE.nickname);
    expect(texts).toContain(MOCK_PROFILE.bio);
  });

  it('"프로필 편집"을 누르면 ProfileEdit으로 이동한다', () => {
    const {root} = renderScreen();
    const editButton = root.root.findByProps({testID: 'edit-profile-button'});

    act(() => {
      editButton.props.onPress();
    });

    expect(mockNavigate).toHaveBeenCalledWith('ProfileEdit');
  });

  it('"이번 분기 리캡 보기" 카드를 누르면 Dashboard로 이동한다', () => {
    const {root} = renderScreen();
    const dashboardCard = root.root.findByProps({testID: 'dashboard-card'});

    act(() => {
      dashboardCard.props.onPress();
    });

    expect(mockNavigate).toHaveBeenCalledWith('Dashboard');
  });

  it('"로그아웃"을 누르면 AuthContext의 isLoggedIn이 false가 된다', () => {
    const {root, getAuthApi} = renderScreen();

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
