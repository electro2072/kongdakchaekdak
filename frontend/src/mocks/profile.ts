export interface ProfileSummary {
  nickname: string;
  bio: string;
  booksReadCount: number;
  sharedRecordsCount: number;
}

// TODO: 프로필 요약(닉네임/한줄소개/누적 통계) API가 아직 없어서 화면설계서(Frame 05) 예시값 그대로
// mock으로 둔다. 회원 정보 조회 API가 정해지면 이 값을 훅에서 실제 fetch로 교체한다.
export const MOCK_PROFILE: ProfileSummary = {
  nickname: '책읽는 콩이',
  bio: '한 달에 3권 읽기가 목표예요 📚',
  booksReadCount: 12,
  sharedRecordsCount: 27,
};
