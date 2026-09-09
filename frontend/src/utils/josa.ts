/**
 * 한국어 조사(助詞) 자동 선택 유틸.
 *
 * `콩닥책닥_보이스확장_밥상레이어.md` §6 구현 메모:
 *   "은유가 들어간 문구는 조사 문제가 더 자주 생깁니다(『{책}』{josa} 뚝딱).
 *    조사 유틸을 먼저 넣는 순서를 지켜주세요."
 *
 * 책 제목·장르 이름처럼 값이 런타임에 정해지는 자리에서, 앞 글자의 받침 유무에
 * 따라 조사를 골라준다. `『아몬드』를` / `『데미안』은` 처럼 자연스러운 문장이 되도록.
 *
 *   josa('아몬드', '을/를')   // → '를'
 *   josa('데미안', '은/는')   // → '은'
 *   withJosa('아몬드', '을/를') // → '아몬드를'
 *
 * 문구 리소스(`strings/ko.ts`)에서는 `{josa}` 자리표시자로 두고, 화면에서
 * `josa(title, '을/를')` 결과를 넘긴다.
 */

/** 지원하는 조사 쌍. 왼쪽이 받침 있을 때, 오른쪽이 받침 없을 때. */
export type JosaPair =
  | '은/는'
  | '이/가'
  | '을/를'
  | '과/와'
  | '이었어요/였어요'
  | '으로/로'
  | '이/'
  | '아/야';

const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;

/**
 * 숫자를 읽었을 때의 받침 유무.
 * '1일'은 '일'로 읽어 ㄹ 받침, '2일'은 '이'로 읽어 받침 없음 — 이런 식이다.
 * 마지막 자리 숫자만 보면 되므로 0~9만 정의한다.
 */
const DIGIT_HAS_BATCHIM: Record<string, boolean> = {
  '0': true, // 영
  '1': true, // 일
  '2': false, // 이
  '3': true, // 삼
  '4': false, // 사
  '5': false, // 오
  '6': true, // 육
  '7': true, // 칠
  '8': true, // 팔
  '9': false, // 구
};

/**
 * 알파벳으로 끝나는 경우, 한국어에서 통상 읽는 소리 기준으로 받침을 판단한다.
 * 예: 'HTML'은 '에이치티엠엘'이라 ㄹ 받침, 'Java'는 '자바'라 받침 없음.
 * 받침 없이 읽는 알파벳만 나열하고 나머지는 받침 있는 것으로 본다.
 */
const ALPHABET_WITHOUT_BATCHIM = new Set([
  'a', // 에이
  'e', // 이
  'i', // 아이
  'o', // 오
  'u', // 유
  'j', // 제이
  'k', // 케이
  'q', // 큐
  't', // 티
  'v', // 브이
  'w', // 더블유
  'x', // 엑스 → 받침 없음
  'y', // 와이
  'z', // 지
]);

/** 조사 판단에 쓸 마지막 글자를 찾는다. 괄호·따옴표·공백 등은 건너뛴다. */
function findLastMeaningfulChar(word: string): string | undefined {
  for (let i = word.length - 1; i >= 0; i -= 1) {
    const char = word[i];
    if (/[0-9a-zA-Z]/.test(char)) {
      return char;
    }
    const code = char.charCodeAt(0);
    if (code >= HANGUL_START && code <= HANGUL_END) {
      return char;
    }
  }
  return undefined;
}

/**
 * 받침(종성)이 있는지 판단한다.
 * 판단할 글자를 못 찾으면 `undefined`를 돌려준다 — 이 경우 호출부에서 받침 있는
 * 쪽으로 폴백한다(둘 중 하나는 골라야 하고, '은/이/을'이 더 무난하다).
 */
function hasBatchim(word: string): boolean | undefined {
  const char = findLastMeaningfulChar(word);
  if (char === undefined) {
    return undefined;
  }

  if (char >= '0' && char <= '9') {
    return DIGIT_HAS_BATCHIM[char];
  }

  if (/[a-zA-Z]/.test(char)) {
    return !ALPHABET_WITHOUT_BATCHIM.has(char.toLowerCase());
  }

  // 한글 음절: (코드 - 0xAC00) % 28 이 0이면 종성 없음
  return (char.charCodeAt(0) - HANGUL_START) % 28 !== 0;
}

/** 'ㄹ' 받침인지 — '으로/로'는 ㄹ 받침도 받침 없는 쪽('로')을 쓴다. */
function endsWithRieul(word: string): boolean {
  const char = findLastMeaningfulChar(word);
  if (char === undefined) {
    return false;
  }
  const code = char.charCodeAt(0);
  if (code < HANGUL_START || code > HANGUL_END) {
    return false;
  }
  // 종성 인덱스 8 = 'ㄹ'
  return (code - HANGUL_START) % 28 === 8;
}

/**
 * 앞 단어에 맞는 조사를 고른다.
 *
 *   josa('아몬드', '을/를')  // → '를'
 *   josa('데미안', '은/는')  // → '은'
 *   josa('서울', '으로/로')  // → '로'  (ㄹ 받침 예외)
 */
export function josa(word: string, pair: JosaPair): string {
  const [withBatchim, withoutBatchim] = pair.split('/');
  const batchim = hasBatchim(word);

  if (batchim === undefined) {
    return withBatchim;
  }

  if (pair === '으로/로' && endsWithRieul(word)) {
    return withoutBatchim;
  }

  return batchim ? withBatchim : withoutBatchim;
}

/** 단어와 조사를 붙여서 돌려준다. `withJosa('아몬드', '을/를')` → '아몬드를' */
export function withJosa(word: string, pair: JosaPair): string {
  return `${word}${josa(word, pair)}`;
}
