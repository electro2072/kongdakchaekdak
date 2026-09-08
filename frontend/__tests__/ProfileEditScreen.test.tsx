import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {afterEach, describe, expect, it, jest} from '@jest/globals';
import {ProfileEditScreen} from '../src/screens/ProfileEditScreen';
import {AuthProvider} from '../src/navigation/AuthContext';
import {ProfileProvider, useProfile} from '../src/navigation/ProfileContext';
import {ToastProvider} from '../src/components/Toast';
import type {ProfileSummary} from '../src/types/profile';
import {MIN_NICKNAME_LENGTH} from '../src/constants/profileOptions';

type UseProfileResult = ReturnType<typeof useProfile>;

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => {
  // 테스터 리포트 BUG-20260827-02 참고 (ProfileScreen.test.tsx와 동일한 원인/수정).
  const actual = jest.requireActual<typeof import('@react-navigation/native')>(
    '@react-navigation/native',
  );
  return {
    ...actual,
    useNavigation: () => ({navigate: mockNavigate, goBack: mockGoBack}),
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

/** 저장 후 ProfileContext에 실제로 반영됐는지 화면 밖에서 관찰하기 위한 테스트 전용 하네스 */
function ProfileHarness({onReady}: {onReady: (api: UseProfileResult) => void}) {
  const api = useProfile();
  onReady(api);
  return null;
}

/**
 * 2026-09-08 업데이트: `ProfileEditScreen`이 `useToast()`를 쓰므로(2026-09-07 토스트 도입)
 * `ToastProvider`로도 감싸야 한다 — 이전엔 빠져 있던 게 그동안 우연히 안 걸렸을 뿐인 기존 갭.
 * `ProfileProvider`가 `useAuth()`에 의존하게 된 것과 별개로 이번에 같이 바로잡는다. 또한
 * `AuthProvider`가 마운트 시 세션 복원 비동기 effect를 가지고 있고 프로필 시드도 비동기라
 * `renderScreen`을 `await act(async () => {...})`로 감싸야 "not wrapped in act" 경고 없이
 * 안정적으로 렌더된다.
 */
describe('ProfileEditScreen', () => {
  let activeRoot: renderer.ReactTestRenderer | undefined;

  afterEach(() => {
    // TouchableOpacity 내부의 press opacity 애니메이션(Animated)이 언마운트 없이 남아있으면
    // 테스트가 끝난 뒤에도 타이머가 돌면서 "Cannot log after tests are done" 경고가 난다.
    activeRoot?.unmount();
    activeRoot = undefined;
    mockNavigate.mockClear();
    mockGoBack.mockClear();
  });

  async function renderScreen() {
    let profileApi: UseProfileResult | undefined;
    await act(async () => {
      activeRoot = renderer.create(
        <AuthProvider>
          <ProfileProvider>
            <ToastProvider>
              <ProfileHarness onReady={value => (profileApi = value)} />
              <ProfileSeeder>
                <ProfileEditScreen />
              </ProfileSeeder>
            </ToastProvider>
          </ProfileProvider>
        </AuthProvider>,
      );
    });
    return {root: activeRoot!, getProfileApi: () => profileApi!};
  }

  it('현재 프로필 값(닉네임/한줄소개)으로 초기화된다', async () => {
    const {root} = await renderScreen();

    expect(root.root.findByProps({testID: 'nickname-input'}).props.value).toBe(
      TEST_PROFILE.nickname,
    );
    expect(root.root.findByProps({testID: 'bio-input'}).props.value).toBe(
      TEST_PROFILE.bio,
    );
  });

  it(`닉네임이 ${MIN_NICKNAME_LENGTH}자 미만이면 저장하기가 비활성화되고 저장되지 않는다`, async () => {
    const {root, getProfileApi} = await renderScreen();
    const nicknameInput = root.root.findByProps({testID: 'nickname-input'});

    act(() => {
      nicknameInput.props.onChangeText('a');
    });

    const saveButton = root.root.findByProps({testID: 'save-button'});
    expect(saveButton.props.disabled).toBe(true);

    // disabled=true라 실제 UI에서는 안 눌리지만, handleSave 자체의 가드(canSubmit) 로직도
    // 직접 확인해둔다 — onPress를 직접 호출해도 저장/뒤로가기가 실행되면 안 된다.
    act(() => {
      saveButton.props.onPress();
    });

    expect(mockGoBack).not.toHaveBeenCalled();
    expect(getProfileApi().profile.nickname).toBe(TEST_PROFILE.nickname);
  });

  it('닉네임/한줄소개/성별/관심분야를 바꿔 저장하면 ProfileContext에 반영되고 뒤로 이동한다', async () => {
    const {root, getProfileApi} = await renderScreen();

    act(() => {
      // sanitizeNickname은 한글/영문/숫자만 허용하고 공백은 제거하므로(닉네임 규칙,
      // constants/profileOptions.ts) 테스트 입력도 공백 없는 문자열을 써야 한다 — 원래
      // '새 닉네임'(공백 포함)을 썼던 건 이 화면이 onChangeText에서 sanitizeNickname을
      // 거친다는 사실과 맞지 않던 기존 오류였고, ToastProvider 누락 때문에 이 assertion까지
      // 실행이 못 갔다가 이번에 그 갭이 걷히면서 드러났다.
      root.root
        .findByProps({testID: 'nickname-input'})
        .props.onChangeText('새닉네임');
      root.root
        .findByProps({testID: 'bio-input'})
        .props.onChangeText('새 소개');
      root.root.findByProps({testID: 'gender-chip-female'}).props.onPress();
      // TEST_PROFILE.interests는 ['소설', '자기계발', '과학'] — '과학'은 해제, '인문'은 추가
      root.root.findByProps({testID: 'interest-chip-과학'}).props.onPress();
      root.root.findByProps({testID: 'interest-chip-인문'}).props.onPress();
    });

    // 2026-09-08 업데이트: handleSave가 PATCH 실제 연동으로 async가 됐다(게스트 진입이라
    // ProfileContext.updateProfile은 로컬 갱신 후 바로 resolve하지만, await 지점을 한 번
    // 거치므로 async act로 그 마이크로태스크까지 흘려보내야 한다).
    await act(async () => {
      root.root.findByProps({testID: 'save-button'}).props.onPress();
    });

    expect(getProfileApi().profile.nickname).toBe('새닉네임');
    expect(getProfileApi().profile.bio).toBe('새 소개');
    expect(getProfileApi().profile.gender).toBe('female');
    expect(getProfileApi().profile.interests).toEqual([
      '소설',
      '자기계발',
      '인문',
    ]);
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });
});
