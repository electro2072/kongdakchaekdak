/**
 * 회원가입(Frame 01.1)·프로필 편집(Frame 05.2) 두 화면이 공유하는 폼 옵션.
 * 디자인 확인 완료(claude/독서기록앱_백엔드요청_디자인_관심분야장르확인_v1.md 답변, 2026-08-27):
 * 관심분야는 정확히 이 6개 고정 목록·다중선택이고, 두 화면이 반드시 같은 값을 써야 한다고
 * 명시돼 있어서(한쪽만 바뀌면 마스터 데이터가 어긋남) 여기 한 곳에만 정의하고 두 화면이
 * 가져다 쓰게 한다. 백엔드 `domain/common/Genre.java`의 한글 라벨과도 정확히 일치해야 한다
 * (개발현황.md 28번 항목 — 마지막 값 "경제·경영"은 가운뎃점 · U+00B7 포함).
 */
import {ko, t} from '../strings';
export const GENDER_OPTIONS = [
  {key: 'female', label: t('profile.gender.female')},
  {key: 'male', label: t('profile.gender.male')},
  {key: 'unspecified', label: t('profile.gender.unspecified')},
] as const;

export type GenderKey = (typeof GENDER_OPTIONS)[number]['key'];

/**
 * 문구는 strings/ko.ts의 `genre` 블록에 있다 — 화면 문자열을 한곳에 모으는 원칙을 따르되,
 * 이 6개는 백엔드 Genre enum과 일치해야 하는 마스터 데이터라 리소스 쪽에도 경고를 달아뒀다.
 * 여기서 `as const`로 다시 묶어야 `Genre` 유니온 타입이 리터럴로 유지된다.
 */
export const INTEREST_OPTIONS = [
  ko.genre.novel,
  ko.genre.essay,
  ko.genre.selfHelp,
  ko.genre.humanities,
  ko.genre.science,
  ko.genre.business,
] as const;

/** 관심분야이자 책 장르(Book.genre)이기도 한 닫힌 6개 열거형 — constants/genreColors.ts가 이 타입 기준으로 색을 고정 매핑한다 */
export type Genre = (typeof INTEREST_OPTIONS)[number];

export const MIN_NICKNAME_LENGTH = 2;
export const MAX_NICKNAME_LENGTH = 10;

/**
 * 닉네임 허용 문자 — 한글/영문/숫자만, 공백·특수문자(이모지 포함) 전부 금지.
 * 회원가입(Frame 01.1)·프로필 편집(Frame 05.2) 두 화면이 저장 시점에 이 규칙으로 최종 검증한다.
 */
export const NICKNAME_PATTERN = /^[가-힣a-zA-Z0-9]*$/u;

/** 최종(완성형) 검증/저장용 — 한글 완성 음절/영문/숫자 외에는 전부 제거한다. */
export function sanitizeNickname(input: string): string {
  return input.replace(/[^가-힣a-zA-Z0-9]/gu, '');
}

/**
 * 2026-09-08 업데이트: 타이핑 중(TextInput의 onChangeText)에는 위 sanitizeNickname()을 바로
 * 쓰면 안 된다 — 안드로이드/iOS에서 한글은 자음+모음이 조합되는 동안 "ㄴ", "ㅐ" 같은 완성 전
 * 낱자(호환 자모, ㄱ-ㅎ/ㅏ-ㅣ) 상태를 거치는데, sanitizeNickname()은 완성된 음절(가-힣)만 허용해서
 * 이 조합 중인 낱자를 매 keystroke마다 지워버린다. 그러면 컨트롤드 TextInput의 value가 네이티브
 * IME의 조합 버퍼와 어긋나면서 조합 자체가 끊겨 한글을 아예 입력할 수 없게 된다(리액트 네이티브의
 * 잘 알려진 이슈 — onChangeText에서 텍스트를 변형하면 CJK IME 조합이 깨짐). "프로필 편집 닉네임
 * 칸에 한글이 안 써진다"는 리포트의 원인이 바로 이것.
 *
 * 그래서 타이핑 중에는 조합 중인 낱자(ㄱ-ㅎ, ㅏ-ㅣ)까지는 지우지 않고 통과시키고, 공백/이모지/
 * 그 외 특수문자만 걸러낸다 — 조합이 끝나면 낱자는 자동으로 완성 음절로 합쳐지므로 최종 값에는
 * 남지 않는다. 저장 시점에는 여전히 sanitizeNickname()으로 한 번 더 엄격히 걸러서, 조합을 끝내지
 * 않고 남긴 낱자 등 예외 케이스까지 정리한다.
 */
export function sanitizeNicknameWhileTyping(input: string): string {
  return input.replace(/[^가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9]/gu, '');
}
