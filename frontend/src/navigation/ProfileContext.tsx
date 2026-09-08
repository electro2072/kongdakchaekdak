import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {EMPTY_PROFILE, type ProfileSummary} from '../types/profile';
import {logger} from '../utils/logger';
import {
  getMe,
  mapGenderResponseToKey,
  updateUser,
  type UserResponse,
} from '../services/userApi';
import {fetchProfileStats} from '../services/profileStatsApi';
import {useAuth} from './AuthContext';

type ProfileEditableFields = Pick<
  ProfileSummary,
  'nickname' | 'bio' | 'gender' | 'interests'
>;

interface ProfileContextValue {
  profile: ProfileSummary;
  /**
   * GET /api/auth/me로 확인한 로그인 사용자 id. 게스트이거나 아직 확인 전이면 null.
   * LibraryContext가 GET /api/books?userId= · POST /api/books 바디에 쓴다.
   */
  userId: number | null;
  isLoading: boolean;
  error: string | null;
  /** /api/auth/me 응답의 daysSinceLastLogin 그대로 — null이면 배너를 띄우지 않는다(백엔드 계약). */
  daysSinceLastLogin: number | null;
  /** 통계(읽은 책/공유한 기록) 로딩 중 — 본문 프로필과 따로 뜬다(보조 정보라 화면을 막지 않는다). */
  isStatsLoading: boolean;
  updateProfile: (fields: ProfileEditableFields) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

function mapUserResponseToEditableFields(
  res: UserResponse,
): ProfileEditableFields {
  return {
    nickname: res.nickname,
    bio: res.bio ?? '',
    gender: mapGenderResponseToKey(res.gender),
    interests: res.interests ?? [],
  };
}

/**
 * 프로필 상태 — GET /api/auth/me · PATCH /api/users/{id} 연동(연동매트릭스 §2.2 #7·#9).
 *
 * ⚠️ 조회 경로는 `/api/users/me`가 아니라 **`/api/auth/me`**다. 예전 주석이 틀렸다(§2.2 ③).
 * interests도 이미 백엔드 연동이 끝나 있다 — `null`=변경 없음, `[]`=전체 해제, 값은 한글 라벨
 * 그대로(`["소설","과학"]`). "다음 라운드" 주석은 폐기됐다(§2.2 ①).
 *
 * 초기값은 mock이 아니라 EMPTY_PROFILE이다. AuthProvider가 부팅 때 이미 세션 검증으로
 * /api/auth/me를 부르므로, 그 응답(sessionUser)이 있으면 그대로 시드로 쓰고 같은 요청을
 * 두 번 보내지 않는다 — 방금 로그인한 경우처럼 시드가 없을 때만 직접 호출한다.
 *
 * 게스트(비회원 둘러보기)는 accessToken이 없어 아무것도 부르지 않고 빈 프로필로 남는다.
 *
 * updateProfile은 낙관적으로 로컬 state를 먼저 갱신한 뒤 PATCH를 보낸다 — 성공하면 응답으로
 * 다시 동기화하고, 실패하면 이전 값으로 롤백한 뒤 에러를 던진다(ProfileEditScreen이 토스트 처리).
 */
export function ProfileProvider({children}: {children: React.ReactNode}) {
  const {isLoggedIn, accessToken, sessionUser} = useAuth();
  const [profile, setProfile] = useState<ProfileSummary>(EMPTY_PROFILE);
  const [userId, setUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [daysSinceLastLogin, setDaysSinceLastLogin] = useState<number | null>(
    null,
  );

  // 로그아웃하면 이전 사용자의 값이 화면에 남지 않도록 되돌린다.
  // userId가 잡혀 있을 때(= 실제 계정으로 /api/auth/me를 받아본 적이 있을 때)만 되돌린다 —
  // 마운트 직후나 게스트(비회원 둘러보기)까지 싸잡아 초기화하면, 아직 로그인하지 않은 상태에서
  // 로컬로만 들고 있는 값을 effect 순서(자식 effect가 먼저 돈다)에 따라 날려버린다.
  useEffect(() => {
    if (isLoggedIn && accessToken) {
      return;
    }
    if (userId === null) {
      return;
    }
    setProfile(EMPTY_PROFILE);
    setUserId(null);
    setDaysSinceLastLogin(null);
    setError(null);
  }, [isLoggedIn, accessToken, userId]);

  useEffect(() => {
    if (!isLoggedIn || !accessToken) {
      return;
    }

    // AuthProvider의 부팅 세션 검증 응답이 있으면 그걸 그대로 쓴다(중복 호출 방지).
    if (sessionUser) {
      setUserId(sessionUser.id);
      setDaysSinceLastLogin(sessionUser.daysSinceLastLogin ?? null);
      setProfile(prev => ({
        ...prev,
        ...mapUserResponseToEditableFields(sessionUser),
      }));
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
        setProfile(prev => ({
          ...prev,
          ...mapUserResponseToEditableFields(res),
        }));
      })
      .catch(e => {
        if (cancelled) {
          return;
        }
        logger.error('ProfileContext', '프로필 조회 실패', {error: e});
        setError(
          e instanceof Error ? e.message : '프로필을 불러오지 못했어요.',
        );
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, accessToken, sessionUser]);

  // userId가 정해진 뒤에 통계를 따로 채운다 — 실패해도 프로필 본문은 그대로 보인다.
  useEffect(() => {
    if (userId === null) {
      return;
    }
    let cancelled = false;
    setIsStatsLoading(true);
    fetchProfileStats(userId)
      .then(stats => {
        if (!cancelled) {
          setProfile(prev => ({...prev, ...stats}));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsStatsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      userId,
      isLoading,
      isStatsLoading,
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
          setProfile(prev => ({
            ...prev,
            ...mapUserResponseToEditableFields(updated),
          }));
        } catch (e) {
          logger.error('ProfileContext', '프로필 수정 실패', {error: e});
          setProfile(previous);
          throw e;
        }
      },
    }),
    [profile, isLoading, isStatsLoading, error, daysSinceLastLogin, userId],
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error(
      'useProfile은 ProfileProvider 안에서만 사용할 수 있습니다.',
    );
  }
  return context;
}
