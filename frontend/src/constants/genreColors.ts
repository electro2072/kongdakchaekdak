import type {ThemeColors} from '../theme';
import {type Genre} from './profileOptions';

/**
 * 6개 장르 고정 색 매핑 (claude/독서기록앱_프론트요청_디자인_6개장르고정색전환_v1.md, 2026-08-28).
 *
 * 이전(등수 기반, claude/독서기록앱_프론트요청_디자인시스템v2동기화_v1.md)에서 뒤집힌 규칙 —
 * 이제는 순위가 아니라 **장르 이름 자체**가 항상 같은 색을 갖는다. 과학/경제·경영이 새로
 * 전용색(chart5/chart6)을 받으면서 6개 장르 전부가 고유색을 갖게 됐고, 닫힌 열거형이라
 * (`Genre.java`에 자유 텍스트/"기타" 없음) "기타" 회색 처리가 더 이상 필요 없다.
 *
 * 이 매핑은 3곳에서 쓰인다(요청 문서 기준):
 *  1. 장르 비율 도넛차트 — GENRE_CHART_COLOR_KEY로 theme의 chart1~6 토큰을 그대로 참조
 *  2. 관심분야·장르 선택 칩 — GENRE_CHIP_COLORS (배경 = 장르 고유색, 텍스트만 대비색)
 *  3. 서재 목록 책 장르 배지 — GENRE_BADGE_COLORS (배경 = 옅은 틴트, 텍스트 = 진한 색, 다크모드 반전)
 *
 * 칩과 배지는 같은 장르라도 색 조합이 다르므로(요청 문서 "칩과 배지는 같은 장르라도 색 조합이
 * 다릅니다" 참고) 절대 서로 재사용하지 않는다.
 */

/** 도넛차트/차트류에서 장르별로 참조할 theme 컬러 토큰 키 */
export const GENRE_CHART_COLOR_KEY: Record<
  Genre,
  Extract<keyof ThemeColors, `chart${number}`>
> = {
  소설: 'chart1',
  에세이: 'chart2',
  자기계발: 'chart3',
  인문: 'chart4',
  과학: 'chart5',
  '경제·경영': 'chart6',
};

interface GenreColorPair {
  light: {bg: string; text: string};
  dark: {bg: string; text: string};
}

/** 관심분야·장르 선택 칩 — 배경은 장르 고유색 그대로, 텍스트만 대비색 */
export const GENRE_CHIP_COLORS: Record<Genre, GenreColorPair> = {
  소설: {light: {bg: '#485a21', text: '#ffffff'}, dark: {bg: '#748a48', text: '#ffffff'}},
  에세이: {light: {bg: '#e8929b', text: '#430011'}, dark: {bg: '#cd717c', text: '#34000a'}},
  자기계발: {light: {bg: '#efb94a', text: '#3e2200'}, dark: {bg: '#ce9b2b', text: '#2c1400'}},
  인문: {light: {bg: '#9b7ba8', text: '#1e0228'}, dark: {bg: '#7d588c', text: '#ffffff'}},
  과학: {light: {bg: '#0089ff', text: '#001a33'}, dark: {bg: '#009af3', text: '#001522'}},
  '경제·경영': {light: {bg: '#1c1a46', text: '#ffffff'}, dark: {bg: '#98bed3', text: '#061117'}},
};

/** 서재 목록 책 장르 배지 — 배경은 옅은 틴트, 텍스트는 진한 색(다크모드는 반전) */
export const GENRE_BADGE_COLORS: Record<Genre, GenreColorPair> = {
  소설: {light: {bg: '#f4f9eb', text: '#485a21'}, dark: {bg: '#070a03', text: '#748a48'}},
  에세이: {light: {bg: '#ffe7e9', text: '#430011'}, dark: {bg: '#1c080b', text: '#cd717c'}},
  자기계발: {light: {bg: '#f8edda', text: '#673e00'}, dark: {bg: '#170e00', text: '#ce9b2b'}},
  인문: {light: {bg: '#f6e9fc', text: '#602f72'}, dark: {bg: '#150a1a', text: '#7d588c'}},
  과학: {light: {bg: '#e9f3ff', text: '#0047ab'}, dark: {bg: '#030e19', text: '#009af3'}},
  '경제·경영': {light: {bg: '#eceef9', text: '#1c1a46'}, dark: {bg: '#061117', text: '#98bed3'}},
};
