import type {GenderKey} from '../constants/profileOptions';

export interface ProfileSummary {
  nickname: string;
  bio: string;
  gender: GenderKey | null;
  /** INTEREST_OPTIONS(constants/profileOptions.ts) 중 다중선택된 값들 */
  interests: string[];
  booksReadCount: number;
  sharedRecordsCount: number;
}

// TODO: 프로필 요약/수정 API가 아직 없어서(PATCH /api/users/{id}는 있지만 interests를 채우는
// DTO 연동은 백엔드가 다음 라운드로 남겨둠 — 개발현황.md 28번 항목) 화면설계서(Frame 05) 예시값
// 그대로 mock으로 둔다. 실제 연동 시 이 초기값을 GET /api/users/me 같은 응답으로 교체하면 된다.
export const MOCK_PROFILE: ProfileSummary = {
  nickname: '책읽는 콩이',
  bio: '한 달에 3권 읽기가 목표예요 📚',
  gender: null,
  interests: ['소설', '자기계발', '과학'],
  booksReadCount: 12,
  sharedRecordsCount: 27,
};
