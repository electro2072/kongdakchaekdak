/**
 * 회원가입(Frame 01.1)·프로필 편집(Frame 05.2) 두 화면이 공유하는 폼 옵션.
 * 디자인 확인 완료(claude/독서기록앱_백엔드요청_디자인_관심분야장르확인_v1.md 답변, 2026-08-27):
 * 관심분야는 정확히 이 6개 고정 목록·다중선택이고, 두 화면이 반드시 같은 값을 써야 한다고
 * 명시돼 있어서(한쪽만 바뀌면 마스터 데이터가 어긋남) 여기 한 곳에만 정의하고 두 화면이
 * 가져다 쓰게 한다. 백엔드 `domain/common/Genre.java`의 한글 라벨과도 정확히 일치해야 한다
 * (개발현황.md 28번 항목 — 마지막 값 "경제·경영"은 가운뎃점 · U+00B7 포함).
 */
export const GENDER_OPTIONS = [
  {key: 'female', label: '여성'},
  {key: 'male', label: '남성'},
  {key: 'unspecified', label: '선택 안 함'},
] as const;

export type GenderKey = (typeof GENDER_OPTIONS)[number]['key'];

export const INTEREST_OPTIONS = [
  '소설',
  '에세이',
  '자기계발',
  '인문',
  '과학',
  '경제·경영',
] as const;

export const MIN_NICKNAME_LENGTH = 2;
