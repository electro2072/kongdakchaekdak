import type {TextStyle} from 'react-native';

/**
 * Pretendard(SIL OFL)를 목표 폰트로 확정했으나(design/typography_and_icons.html),
 * 실제 .ttf 에셋 번들링 + 네이티브 링크(android/ios)는 로컬 빌드 검증이 필요해 별도 작업으로 남겨둔다.
 * 지금은 시스템 폰트로 폴백하고, 폰트 파일이 준비되면 이 상수만 바꾸면 전체 타입 스케일에 적용된다.
 */
export const FONT_FAMILY = undefined as string | undefined;

export type TypographyVariant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body'
  | 'bodyStrong'
  | 'caption'
  | 'overline'
  | 'button'
  | 'stat';

/** design/typography_and_icons.html의 타입 스케일 표(1편) 그대로 옮긴 값 */
export const typography: Record<TypographyVariant, TextStyle> = {
  display: {
    fontFamily: FONT_FAMILY,
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 39,
    letterSpacing: -0.6,
  },
  h1: {
    fontFamily: FONT_FAMILY,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 29.7,
    letterSpacing: -0.44,
  },
  h2: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 25.2,
    letterSpacing: -0.18,
  },
  h3: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 23.2,
    letterSpacing: -0.16,
  },
  body: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodyStrong: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 24,
  },
  caption: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 19.5,
  },
  overline: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16.8,
    letterSpacing: 0.24,
  },
  button: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.15,
  },
  stat: {
    fontFamily: FONT_FAMILY,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 33.6,
    letterSpacing: -0.56,
    fontVariant: ['tabular-nums'],
  },
};
