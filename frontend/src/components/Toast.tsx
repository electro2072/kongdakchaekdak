import React, {createContext, useCallback, useContext, useRef, useState} from 'react';
import {Animated, StyleSheet, Text} from 'react-native';
import {AlertCircle, AlertTriangle, CheckCircle, Info} from 'lucide-react-native';

/**
 * 화면 하단 토스트/스낵바 — claude/독서기록앱_프론트요청_디자인_토스트스낵바컴포넌트.md
 * (디자인 에이전트, 2026-09-07) 스펙 그대로 구현.
 *
 * 라이트/다크 모드와 무관하게 색이 고정이라(토스트는 화면 위에 잠깐 뜨는 요소라 밑에 어떤
 * 화면이 있어도 또렷하게 보여야 한다는 게 디자인 쪽 판단) useTheme()을 쓰지 않는다.
 * 스택(여러 토스트 동시 노출)은 디자인 문서에서 이번 범위 제외 — "한 번에 하나만".
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ShowToastOptions {
  type: ToastType;
  message: string;
  /**
   * 하단 탭바가 있는 화면(일정/서재/공유/프로필)에서 true로 넘기면 탭바를 가리지 않도록
   * 20px가 아니라 76px 위에 뜬다. 라우트 자동 감지 대신 호출부에서 명시적으로 넘기는 방식 —
   * 구현이 단순하고 실수로 탭바를 가리는 버그가 안 생긴다(설계 문서 2-1 참고).
   */
  aboveTabBar?: boolean;
}

interface ToastContextValue {
  showToast: (options: ShowToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION_MS = 2500;
const FADE_MS = 200;

// 디자인 스펙 고정값 — 라이트/다크 공용.
const TOAST_BG = '#262723';
const TOAST_TEXT = '#f6f7f3';
const ICON_COLOR: Record<ToastType, string> = {
  success: '#a9c37e',
  error: '#f18ea0',
  warning: '#e8b84a',
  info: '#9dc1f5',
};
const ICON_BY_TYPE: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

export function ToastProvider({children}: {children: React.ReactNode}) {
  const [current, setCurrent] = useState<ShowToastOptions | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: FADE_MS,
      useNativeDriver: true,
    }).start(() => setCurrent(null));
  }, [opacity]);

  const showToast = useCallback(
    (options: ShowToastOptions) => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
      setCurrent(options);
      opacity.setValue(0);
      Animated.timing(opacity, {
        toValue: 1,
        duration: FADE_MS,
        useNativeDriver: true,
      }).start();
      hideTimer.current = setTimeout(hide, TOAST_DURATION_MS);
    },
    [hide, opacity],
  );

  const Icon = current ? ICON_BY_TYPE[current.type] : null;

  return (
    <ToastContext.Provider value={{showToast}}>
      {children}
      {current ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toast,
            current.aboveTabBar ? styles.toastAboveTabBar : styles.toastDefault,
            {backgroundColor: TOAST_BG, opacity},
          ]}>
          {Icon ? <Icon size={16} color={ICON_COLOR[current.type]} /> : null}
          <Text style={[styles.text, {color: TOAST_TEXT}]} numberOfLines={2}>
            {current.message}
          </Text>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

/** 화면에서 `const {showToast} = useToast();` 로 사용. ToastProvider 밖에서 쓰면 에러를 던진다. */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast는 ToastProvider 안에서만 사용할 수 있습니다.');
  }
  return context;
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 18,
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    shadowColor: '#11120f',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 6,
  },
  toastDefault: {
    bottom: 20,
  },
  toastAboveTabBar: {
    bottom: 76,
  },
  text: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '700',
  },
});
