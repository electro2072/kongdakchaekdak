import {describe, expect, it} from '@jest/globals';
import {
  GENDER_OPTIONS,
  INTEREST_OPTIONS,
  MIN_NICKNAME_LENGTH,
} from '../src/constants/profileOptions';

/**
 * 회원가입(Frame 01.1)·프로필 편집(Frame 05.2)이 공유하는 옵션 데이터를 검증한다.
 * 디자인이 확인해준 값(claude/독서기록앱_백엔드요청_디자인_관심분야장르확인_v1.md 답변,
 * 2026-08-27)과 백엔드 Genre enum(개발현황.md 28번 항목)이 이 상수 하나에 맞춰져 있어야
 * 두 화면의 마스터 데이터가 어긋나지 않는다.
 */
describe('profileOptions', () => {
  it('관심분야는 디자인이 확정한 6개 고정 목록과 정확히 일치한다', () => {
    expect(INTEREST_OPTIONS).toEqual([
      '소설',
      '에세이',
      '자기계발',
      '인문',
      '과학',
      '경제·경영',
    ]);
  });

  it('관심분야에 중복 값이 없다', () => {
    expect(new Set(INTEREST_OPTIONS).size).toBe(INTEREST_OPTIONS.length);
  });

  it('"경제·경영"은 가운뎃점(U+00B7)을 쓴다 — 백엔드 Genre enum 라벨과 문자 단위로 일치해야 함', () => {
    const economy = INTEREST_OPTIONS.find(item => item.startsWith('경제'));
    expect(economy).toBe('경제·경영');
  });

  it('성별 옵션 key는 서로 중복되지 않는다', () => {
    const keys = GENDER_OPTIONS.map(option => option.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('성별 옵션은 3개(여성/남성/선택 안 함)다', () => {
    expect(GENDER_OPTIONS).toHaveLength(3);
    expect(GENDER_OPTIONS.map(option => option.label)).toEqual([
      '여성',
      '남성',
      '선택 안 함',
    ]);
  });

  it('닉네임 최소 길이는 1 이상의 정수다', () => {
    expect(Number.isInteger(MIN_NICKNAME_LENGTH)).toBe(true);
    expect(MIN_NICKNAME_LENGTH).toBeGreaterThanOrEqual(1);
  });
});
