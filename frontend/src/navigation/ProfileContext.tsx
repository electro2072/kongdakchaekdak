import React, {createContext, useContext, useEffect, useMemo, useState} from 'react';
import {MOCK_PROFILE, type ProfileSummary} from '../mocks/profile';
import {logger} from '../utils/logger';
import {
  getMe,
  mapGenderResponseToKey,
  updateUser,
  type UserResponse,
} from '../services/userApi';
import {useAuth} from './AuthContext';

type ProfileEditableFields = Pick<
  ProfileSummary,
  'nickname' | 'bio' | 'gender' | 'interests'
>;

interface ProfileContextValue {
  profile: ProfileSummary;
  isLoading: boolean;
  error: string | null;
  /** /api/auth/me 응답의 daysSinceLastLogin 그대로 — null이면 배너를 띄우지 않는다(백엔드 계약). */
  daysSinceLastLogin: number | null;
  updateProfile: (fields: ProfileEditableFields) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

function mapUserResponseToEditableFields(res: UserResponse): ProfileEditableFields {
  return {
    nickname: res.nickname,
    bio: res.bio ?? '',
    gender: mapGenderResponseToKey(res.gender),
    interests: res.interests ?? [],
  };
}

/**
 * 2026-09-08 업데이트: GET /api/auth/me · PATCH /api/users/{id} 실제 연동
 * (claude/독서기록앱_프론트_전체API연동_설계_v1.md 4장). 로그인 직후(AuthContext.isLoggedIn=true
 * & accessToken 존재)에 자동으로 /api/auth/me를 호출해 닉네임/한줄소개/성별/관심분야를
 * 덮어쓴다 — 게스트(비회원 둘러보기) 진입은 accessToken이 없어 그대로 mock 값을 유지한다.
 *
 * updateProfile은 낙관적으로 로컬 state를 먼저 갱신한 뒤 PATCH 요청을 보낸다 — 성공하면 응답으로
 * 다시 한번 동기화하고, 실패하면 이전 값으로 롤백한 뒤 에러를 던진다(화면에서 에러 토스트 처리 —
 * ProfileEditScreen 참고). userId를 아직 모르면(게스트) 로컬 상태만 갱신하고 API 호출은 생략한다.
 *
 * booksReadCount/sharedRecordsCount는 백엔드에 전용 집계 필드가 없다고 확인됐다(회신 완료) —
 * TODO: 서재(3단계)/공유이력(5단계) 연동이 끝나면 그때 클라이언트에서 계산해 채워 넣는다. 그
 * 전까지는 화면이 비어 보이지 않도록 mock 값을 그대로 둔다.
 */
export function ProfileProvider({children}: {children: React.ReactNode}) {
  const {isLoggedIn, accessToken} = useAuth();
  const [profile, setProfile] = useState<ProfileSummary>(MOCK_PROFILE);
  const [userId, setUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [daysSinceLastLogin, setDaysSinceLastLogin] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoggedIn || !accessToken) {
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    getMe()
      .then(res => {
        if (cancelled) {
          return;
        }
        setUserId(res.id);
        setDaysSinceLastLogin(res.daysSinceLastLogin ?? null);
        setProfile(prev => ({...prev, ...mapUserResponseToEditableFields(res)}));
      })
      .catch(e => {
        if (cancelled) {
          return;
        }
        logger.error('ProfileContext', '프로필 조회 실패', {error: e});
        setError(e instanceof Error ? e.message : '프로필을 불러오지 못했어요.');
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, accessToken]);

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      isLoading,
      error,
      daysSinceLastLogin,
      updateProfile: async fields => {
        const previous = profile;
        setProfile(prev => ({...prev, ...fields}));
        if (userId === null) {
          // 게스트 진입(비회원 둘러보기) — 실제 계정이 없어 로컬 상태만 갱신한다.
          return;
        }
        try {
          const updated = await updateUser(userId, fields);
          setProfile(prev => ({...prev, ...mapUserResponseToEditableFields(updated)}));
        } catch (e) {
          logger.error('ProfileContext', '프로필 수정 실패', {error: e});
          setProfile(previous);
          throw e;
        }
      },
    }),
    [profile, isLoading, error, daysSinceLastLogin, userId],
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
