import {describe, expect, it} from '@jest/globals';
import {josa, withJosa} from '../src/utils/josa';

describe('josa — 받침에 따라 조사를 고른다', () => {
  it('받침이 없으면 오른쪽 조사를 쓴다', () => {
    expect(josa('아몬드', '을/를')).toBe('를');
    expect(josa('아몬드', '은/는')).toBe('는');
    expect(josa('소설', '이었어요/였어요')).toBe('이었어요');
  });

  it('받침이 있으면 왼쪽 조사를 쓴다', () => {
    expect(josa('데미안', '은/는')).toBe('은');
    expect(josa('저주토끼', '은/는')).toBe('는');
    expect(josa('불편한 편의점', '을/를')).toBe('을');
  });

  it('ㄹ 받침은 "으로/로"에서만 예외로 받침 없는 쪽을 쓴다', () => {
    expect(josa('서울', '으로/로')).toBe('로');
    expect(josa('서울', '을/를')).toBe('을');
  });

  it('숫자로 끝나면 읽는 소리 기준으로 판단한다', () => {
    expect(josa('1권', '은/는')).toBe('은'); // '권' 받침
    expect(josa('7', '을/를')).toBe('을'); // 칠
    expect(josa('2', '을/를')).toBe('를'); // 이
  });

  it('알파벳으로 끝나면 한국어로 읽는 소리 기준으로 판단한다', () => {
    expect(josa('Java', '을/를')).toBe('를'); // 자바
    expect(josa('Python', '을/를')).toBe('을'); // 파이썬
  });

  it('괄호·따옴표 같은 기호는 건너뛰고 그 앞 글자를 본다', () => {
    expect(josa('『아몬드』', '을/를')).toBe('를');
    expect(josa("'소설'", '이었어요/였어요')).toBe('이었어요');
  });

  it('판단할 글자가 없으면 받침 있는 쪽으로 폴백한다', () => {
    expect(josa('???', '은/는')).toBe('은');
  });

  it('withJosa는 단어와 조사를 붙여준다', () => {
    expect(withJosa('아몬드', '을/를')).toBe('아몬드를');
    expect(withJosa('데미안', '은/는')).toBe('데미안은');
  });
});
