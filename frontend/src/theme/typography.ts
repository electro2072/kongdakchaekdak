import type {TextStyle} from 'react-native';

/**
 * Pretendard(SIL OFL) 정적 웨이트 5종을 `assets/fonts/`에 번들링했다(2026-08-27, 디자인 요청 반영).
 * 이 폰트 파일들을 iOS/Android 네이티브 프로젝트에 실제로 링크하려면 로컬에서
 * `cd frontend && npx react-native-asset` 실행 + 앱 재빌드가 필요하다(이 클라우드 세션은
 * 네이티브 빌드 도구를 실행할 수 없어 이 한 단계만 로컬에서 해줘야 한다).
 *
 * 커스텀 폰트를 iOS/Android 양쪽에서 안정적으로 쓰려면 `fontFamily`+`fontWeight` 조합이 아니라
 * "그 굵기 전용 폰트 파일 이름을 fontFamily에 직접 지정"하는 방식이 정석이다(특히 Android는
 * fontWeight만으로 커스텀 폰트의 다른 굵기를 선택하지 못하는 경우가 많음). 그래서 굵기별로
 * 별도 상수를 두고, 각 타입 스케일이 자기 굵기에 맞는 파일명을 직접 참조한다.
 * `fontWeight`도 함께 남겨둔다 — 링크 전(또는 실패 시) 시스템 폰트로 폴백되더라도 굵기 인상만은
 * 최대한 비슷하게 유지하기 위함.
 */
const PRETENDARD = {
  regular: 'Pretendard-Regular', // 400
  medium: 'Pretendard-Medium', // 500
  semibold: 'Pretendard-SemiBold', // 600
  bold: 'Pretendard-Bold', // 700
  extrabold: 'Pretendard-ExtraBold', // 800
} as const;

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
    fontFamily: PRETENDARD.extrabold,
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 39,
    letterSpacing: -0.6,
  },
  h1: {
    fontFamily: PRETENDARD.bold,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 29.7,
    letterSpacing: -0.44,
  },
  h2: {
    fontFamily: PRETENDARD.bold,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 25.2,
    letterSpacing: -0.18,
  },
  h3: {
    fontFamily: PRETENDARD.semibold,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 23.2,
    letterSpacing: -0.16,
  },
  body: {
    fontFamily: PRETENDARD.regular,
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodyStrong: {
    fontFamily: PRETENDARD.semibold,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 24,
  },
  caption: {
    fontFamily: PRETENDARD.regular,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 19.5,
  },
  overline: {
    fontFamily: PRETENDARD.medium,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16.8,
    letterSpacing: 0.24,
  },
  button: {
    fontFamily: PRETENDARD.semibold,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.15,
  },
  stat: {
    fontFamily: PRETENDARD.extrabold,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 33.6,
    letterSpacing: -0.56,
    fontVariant: ['tabular-nums'],
  },
};
