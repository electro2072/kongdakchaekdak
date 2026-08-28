import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {afterEach, describe, expect, it, jest} from '@jest/globals';
import {ProfileEditScreen} from '../src/screens/ProfileEditScreen';
import {ProfileProvider, useProfile} from '../src/navigation/ProfileContext';
import {MOCK_PROFILE} from '../src/mocks/profile';
import {MIN_NICKNAME_LENGTH} from '../src/constants/profileOptions';

type UseProfileResult = ReturnType<typeof useProfile>;

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => {
  // 테스터 리포트 BUG-20260827-02 참고 (ProfileScreen.test.tsx와 동일한 원인/수정).
  const actual =
    jest.requireActual<typeof import('@react-navigation/native')>(
      '@react-navigation/native',
    );
  return {
    ...actual,
    useNavigation: () => ({navigate: mockNavigate, goBack: mockGoBack}),
  };
});

/** 저장 후 ProfileContext에 실제로 반영됐는지 화면 밖에서 관찰하기 위한 테스트 전용 하네스 */
function ProfileHarness({onReady}: {onReady: (api: UseProfileResult) => void}) {
  const api = useProfile();
  onReady(api);
  return null;
}

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

  function renderScreen() {
    let profileApi: UseProfileResult | undefined;
    act(() => {
      activeRoot = renderer.create(
        <ProfileProvider>
          <ProfileHarness onReady={value => (profileApi = value)} />
          <ProfileEditScreen />
        </ProfileProvider>,
      );
    });
    return {root: activeRoot!, getProfileApi: () => profileApi!};
  }

  it('현재 프로필 값(닉네임/한줄소개)으로 초기화된다', () => {
    const {root} = renderScreen();

    expect(root.root.findByProps({testID: 'nickname-input'}).props.value).toBe(
      MOCK_PROFILE.nickname,
    );
    expect(root.root.findByProps({testID: 'bio-input'}).props.value).toBe(
      MOCK_PROFILE.bio,
    );
  });

  it(`닉네임이 ${MIN_NICKNAME_LENGTH}자 미만이면 저장하기가 비활성화되고 저장되지 않는다`, () => {
    const {root, getProfileApi} = renderScreen();
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
    expect(getProfileApi().profile.nickname).toBe(MOCK_PROFILE.nickname);
  });

  it('닉네임/한줄소개/성별/관심분야를 바꿔 저장하면 ProfileContext에 반영되고 뒤로 이동한다', () => {
    const {root, getProfileApi} = renderScreen();

    act(() => {
      root.root
        .findByProps({testID: 'nickname-input'})
        .props.onChangeText('새 닉네임');
      root.root.findByProps({testID: 'bio-input'}).props.onChangeText('새 소개');
      root.root.findByProps({testID: 'gender-chip-female'}).props.onPress();
      // MOCK_PROFILE.interests는 ['소설', '자기계발', '과학'] — '과학'은 해제, '인문'은 추가
      root.root.findByProps({testID: 'interest-chip-과학'}).props.onPress();
      root.root.findByProps({testID: 'interest-chip-인문'}).props.onPress();
    });

    act(() => {
      root.root.findByProps({testID: 'save-button'}).props.onPress();
    });

    expect(getProfileApi().profile.nickname).toBe('새 닉네임');
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
