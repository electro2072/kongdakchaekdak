import React from 'react';
import {Modal, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useTheme} from '../theme';

/**
 * 중앙 확인/경고 다이얼로그 — claude/독서기록앱_프론트요청_디자인_확인다이얼로그액션시트컴포넌트.md
 * (디자인 에이전트, 2026-09-07) "① 확인/경고 다이얼로그" 스펙 기준.
 *
 * 토스트/로딩 오버레이와 달리 이 컴포넌트는 화면 표면(라이트/다크)을 그대로 따른다 — 카드 배경은
 * theme의 surface, "일반" 확인 버튼은 accentSolidBg/onAccentSolid를 그대로 재사용한다(디자인
 * 스펙의 일반 확인 버튼 색 = 브랜드색이 정확히 이 두 토큰과 일치해서 새 토큰이 필요 없었음).
 *
 * `danger`는 로그아웃/삭제처럼 파괴적 확인에 쓰기 위해 시그니처만 만들어뒀다(스펙의 "위험" 버튼
 * 색 규칙, `--error`). 이번 라운드(신규 가입 온보딩)는 비파괴적이라 danger를 쓰지 않는다 —
 * 실제 로그아웃 확인에 연결할 땐 디자인 스펙의 `--on-error`(다크에서 흰 텍스트 대신 진한 텍스트)에
 * 해당하는 theme 토큰이 아직 없어서, 그때 추가하고 아래 onError 처리를 교체해야 한다.
 */
export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  /** 로그아웃/삭제 등 파괴적 액션 — 확인 버튼을 error 색으로 표시 (이번 라운드는 미사용) */
  danger?: boolean;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
  danger,
}: ConfirmDialogProps) {
  const {colors, typography, radii} = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}>
      <View style={styles.scrim}>
        <View style={[styles.card, {backgroundColor: colors.surface}]}>
          <Text
            style={[typography.bodyStrong, {color: colors.n900, fontSize: 13.5}]}>
            {title}
          </Text>
          {message ? (
            <Text
              style={[
                typography.caption,
                {color: colors.n600, fontSize: 11, marginTop: 8},
              ]}>
              {message}
            </Text>
          ) : null}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              testID="confirm-dialog-cancel"
              style={[
                styles.button,
                {
                  backgroundColor: 'transparent',
                  borderWidth: 1,
                  borderColor: colors.n300,
                  borderRadius: radii.pill,
                },
              ]}
              onPress={onCancel}>
              <Text style={[typography.button, {color: colors.n700}]}>
                {cancelLabel}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="confirm-dialog-confirm"
              style={[
                styles.button,
                {
                  backgroundColor: danger ? colors.error : colors.accentSolidBg,
                  borderRadius: radii.pill,
                },
              ]}
              onPress={onConfirm}>
              <Text
                style={[
                  typography.button,
                  {color: danger ? '#ffffff' : colors.onAccentSolid},
                ]}>
                {confirmLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    // 디자인 스펙 고정값 — 로딩 오버레이와 동일한 스크림을 재사용.
    backgroundColor: 'rgba(10,11,8,0.58)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    borderRadius: 18,
    padding: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
  },
  button: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
