import React, {createContext, useContext, useMemo, useState} from 'react';
import {MOCK_PROFILE, type ProfileSummary} from '../mocks/profile';

type ProfileEditableFields = Pick<
  ProfileSummary,
  'nickname' | 'bio' | 'gender' | 'interests'
>;

interface ProfileContextValue {
  profile: ProfileSummary;
  updateProfile: (fields: ProfileEditableFields) => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

/**
 * 임시 mock 프로필 상태. PATCH /api/users/{id}는 있지만 interests를 채우는 DTO 연동은
 * 백엔드가 다음 라운드로 남겨뒀고(개발현황.md 28번 항목), 나머지 필드(닉네임/한줄소개/성별)도
 * 아직 실제 연동을 안 붙였다 — AuthContext와 동일한 패턴으로 로컬 state만 관리한다.
 * ProfileEditScreen에서 저장하면 이 state가 갱신되고 ProfileScreen이 바로 반영해서 보여준다.
 * 앱을 재시작하면 초기화된다(영속화 없음).
 *
 * TODO: 실제 연동 시 초기값을 GET /api/users/me 응답으로, updateProfile 내부를
 * PATCH /api/users/{id} 호출로 교체한다.
 */
export function ProfileProvider({children}: {children: React.ReactNode}) {
  const [profile, setProfile] = useState<ProfileSummary>(MOCK_PROFILE);

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      updateProfile: fields => setProfile(prev => ({...prev, ...fields})),
    }),
    [profile],
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile은 ProfileProvider 안에서만 사용할 수 있습니다.');
  }
  return context;
}
