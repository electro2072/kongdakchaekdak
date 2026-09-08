import React from 'react';
import {Text} from 'react-native';
import renderer, {act} from 'react-test-renderer';
import {describe, expect, it, jest} from '@jest/globals';
import {AuthProvider} from '../src/navigation/AuthContext';
import {ProfileProvider, useProfile} from '../src/navigation/ProfileContext';
import {MOCK_PROFILE} from '../src/mocks/profile';

type UseProfileResult = ReturnType<typeof useProfile>;

/** Provider 내부에서 useProfile()의 반환값을 밖으로 꺼내오기 위한 테스트 전용 하네스 */
function Harness({onReady}: {onReady: (api: UseProfileResult) => void}) {
  const api = useProfile();
  onReady(api);
  return <Text>{api.profile.nickname}</Text>;
}

function BareConsumer() {
  useProfile();
  return null;
}

/**
 * ProfileEditScreen에서 저장한 값이 ProfileScreen에 바로 반영되는 것은 전적으로
 * 이 Context의 state 관리에 달려 있어서, AuthContext.tsx와 마찬가지로 별도로 검증한다.
 *
 * 2026-09-08 업데이트: `ProfileProvider`가 `useAuth()`에 의존하게 돼서 `AuthProvider`로 감싸야
 * 하고, `AuthProvider`가 마운트 시 AsyncStorage에서 세션을 복원하는 비동기 effect를 갖게 되면서
 * (`isRestoring` → false로 바뀌는 상태 업데이트) 렌더링을 `await act(async () => {...})`로 감싸야
 * "not wrapped in act" 경고 없이 그 업데이트까지 안정적으로 흘려보낼 수 있다.
 */
describe('ProfileContext', () => {
  it('Provider 밖에서 useProfile을 쓰면 에러를 던진다', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      act(() => {
        renderer.create(<BareConsumer />);
      });
    }).toThrow('useProfile은 ProfileProvider 안에서만 사용할 수 있습니다.');

    consoleSpy.mockRestore();
  });

  it('초기값은 mocks/profile.ts의 MOCK_PROFILE이다', async () => {
    let api: UseProfileResult | undefined;
    let root: renderer.ReactTestRenderer | undefined;
    await act(async () => {
      root = renderer.create(
        <AuthProvider>
          <ProfileProvider>
            <Harness onReady={value => (api = value)} />
          </ProfileProvider>
        </AuthProvider>,
      );
    });

    expect(api?.profile).toEqual(MOCK_PROFILE);
    root?.unmount();
  });

  it('updateProfile은 넘긴 필드만 갱신하고, 넘기지 않은 필드(활동 통계 등)는 그대로 둔다', async () => {
    let api: UseProfileResult | undefined;
    let root: renderer.ReactTestRenderer | undefined;
    await act(async () => {
      root = renderer.create(
        <AuthProvider>
          <ProfileProvider>
            <Harness onReady={value => (api = value)} />
          </ProfileProvider>
        </AuthProvider>,
      );
    });

    act(() => {
      api?.updateProfile({
        nickname: '새 닉네임',
        bio: '',
        gender: 'female',
        interests: ['과학'],
      });
    });

    expect(api?.profile.nickname).toBe('새 닉네임');
    expect(api?.profile.bio).toBe('');
    expect(api?.profile.gender).toBe('female');
    expect(api?.profile.interests).toEqual(['과학']);
    // updateProfile이 받지 않는 필드는 이전 값 그대로 유지되어야 한다
    expect(api?.profile.booksReadCount).toBe(MOCK_PROFILE.booksReadCount);
    expect(api?.profile.sharedRecordsCount).toBe(MOCK_PROFILE.sharedRecordsCount);
    root?.unmount();
  });
});
