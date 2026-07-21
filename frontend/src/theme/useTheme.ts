import {useColorScheme} from 'react-native';
import {darkColors, lightColors, type ThemeColors} from './colors';
import {typography} from './typography';

export const radii = {
  sm: 8,
  md: 14,
  card: 16,
  pill: 999,
};

export interface Theme {
  colors: ThemeColors;
  typography: typeof typography;
  radii: typeof radii;
  isDark: boolean;
}

/** design/hifi_mockup_v1.html의 `.dark` 스코프와 동일하게, 시스템 다크모드 설정을 그대로 따른다 */
export function useTheme(): Theme {
  const isDark = useColorScheme() === 'dark';
  return {
    colors: isDark ? darkColors : lightColors,
    typography,
    radii,
    isDark,
  };
}
