import type {GenderKey} from '../constants/profileOptions';

/**
 * 프로필 탭(Frame 05) · 프로필 편집(Frame 05.2)이 쓰는 화면용 프로필 모델.
 * 원래 src/mocks/profile.ts에 타입과 mock 값이 같이 있었는데, mock을 걷어내면서
 * 타입만 여기로 옮겼다.
 *
 * 서버 응답 타입(UserResponse)과 1:1이 아니다 —
 *  - nickname/bio/gender/interests: GET /api/auth/me · PATCH /api/users/{id} 응답에서 옴
 *  - booksReadCount/sharedRecordsCount: 백엔드에 집계 필드가 없어 FE가 계산한다
 *    (연동매트릭스 §2.2 ② — GET /api/books?userId={id}&status=done 개수 +
 *     GET /api/share-records 배열 길이)
 */
export interface ProfileSummary {
  nickname: string;
  bio: string;
  gender: GenderKey | null;
  /** INTEREST_OPTIONS(constants/profileOptions.ts) 중 다중선택된 값들. 한글 라벨 그대로 저장·전송한다. */
  interests: string[];
  booksReadCount: number;
  sharedRecordsCount: number;
}

/**
 * 로그인 전/게스트/로딩 중에 쓰는 빈 프로필. mock 예시값("책읽는 콩이", 12/27)을 초기값으로
 * 두면 실패했을 때 남의 데이터처럼 보이는 값이 화면에 남는다 — 비어 있는 게 낫다.
 */
export const EMPTY_PROFILE: ProfileSummary = {
  nickname: '',
  bio: '',
  gender: null,
  interests: [],
  booksReadCount: 0,
  sharedRecordsCount: 0,
};
