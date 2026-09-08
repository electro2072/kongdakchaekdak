import React from 'react';
import Svg, {Rect, Circle, Line, Path} from 'react-native-svg';

/**
 * 하단 탭바 전용 filled 아이콘 4종.
 *
 * 디자인 근거: design/typography_and_icons.html v1.4 "5. 탭바 아이콘 — All Filled"
 *            + design/hifi_mockup_v1.html v1.16 (커밋 a6755d2)
 *
 * Lucide는 전 아이콘이 outline 전용이라 filled 변형이 없어 콩닥책닥이 자체 제작한 것으로,
 * Lucide 라이선스 대상이 아니다. 활성/비활성 관계없이 항상 filled를 쓰고, 선택 상태는
 * 색상(--p700)과 라벨 굵기로만 구분한다.
 *
 * 2톤 표현 기법: 단색 하나로는 내부 명암을 낼 수 없어, 같은 색을 불투명도 1.0 / 0.55
 * 두 겹으로 나눠 칠한다. 별도 색상 토큰을 추가하지 않으므로 라이트/다크 모두 그대로 동작.
 */

const DIM = 0.55;

export interface TabIconProps {
  /** 렌더 크기(px). 탭바 기본값 22 */
  size?: number;
  /** currentColor 대체값 — react-navigation의 tabBarIcon이 넘겨주는 color */
  color: string;
}

export function CalendarDaysFill({size = 22, color}: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x="3" y="4" width="18" height="17" rx="3" fill={color} opacity={DIM} />
      <Rect x="3" y="4" width="18" height="6" rx="3" fill={color} />
      <Rect x="7" y="2" width="2" height="4" rx="1" fill={color} />
      <Rect x="15" y="2" width="2" height="4" rx="1" fill={color} />
    </Svg>
  );
}

export function LibraryFill({size = 22, color}: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x="3" y="4" width="4" height="16" rx="1.3" fill={color} />
      <Rect x="8.6" y="7" width="4" height="13" rx="1.3" fill={color} opacity={DIM} />
      <Rect x="14.2" y="6" width="4" height="14" rx="1.3" fill={color} />
      <Rect x="19.8" y="9" width="2.2" height="11" rx="1.1" fill={color} opacity={DIM} />
    </Svg>
  );
}

export function Share2Fill({size = 22, color}: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="18" cy="5" r="3.4" fill={color} />
      <Circle cx="6" cy="12" r="3.4" fill={color} />
      <Circle cx="18" cy="19" r="3.4" fill={color} />
      <Line
        x1="8.7"
        y1="13.6"
        x2="15.3"
        y2="17.4"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <Line
        x1="15.3"
        y1="6.6"
        x2="8.7"
        y2="10.4"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function UserFill({size = 22, color}: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="8" r="4.2" fill={color} />
      <Path d="M4 20.2c0-4.6 3.7-7.4 8-7.4s8 2.8 8 7.4v0.8H4v-0.8z" fill={color} />
    </Svg>
  );
}
