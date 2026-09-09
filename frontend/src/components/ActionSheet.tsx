import React from 'react';
import {Modal, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import type {LucideIcon} from 'lucide-react-native';
import {useTheme} from '../theme';
import {t} from '../strings';

export interface ActionSheetOption {
  key: string;
  label: string;
  /**
   * lucide-react-native가 내보내는 아이콘 컴포넌트 타입.
   *
   * 예전엔 `React.ComponentType<{size?: number; color?: string}>`로 직접 적어뒀는데,
   * lucide의 `LucideProps.size`는 `string | number`라 `propTypes`가 반공변 위치에서
   * 충돌해 BookDetailScreen에서 TS2322가 났다(`npm run typecheck` 5건 — Frontend Tests
   * CI가 이것 때문에 계속 실패). 라이브러리가 내보내는 타입을 그대로 쓰는 게 맞다.
   */
  icon: LucideIcon;
  /** 삭제 등 파괴적 액션 — error 색으로 구분 */
  danger?: boolean;
  onPress: () => void;
}

export interface ActionSheetProps {
  visible: boolean;
  /** 대상 제목 — 선택 */
  title?: string;
  options: ActionSheetOption[];
  cancelLabel?: string;
  onCancel: () => void;
}

/**
 * 하단 액션 시트 — claude/독서기록앱_프론트요청_디자인_확인다이얼로그액션시트컴포넌트.md
 * "② 하단 액션 시트" 스펙 기준. `ConfirmDialog`와 동일하게 화면 표면(라이트/다크)을 따르고,
 * 스크림은 같은 `rgba(10,11,8,0.58)`을 재사용한다.
 *
 * 구성 순서: 핸들바 → 대상 제목(선택) → 옵션 행들 → 구분선 → 취소 행.
 */
export function ActionSheet({
  visible,
  title,
  options,
  cancelLabel = t('common.cancel'),
  onCancel,
}: ActionSheetProps) {
  const {colors, typography} = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}>
      <TouchableOpacity
        style={styles.scrim}
        activeOpacity={1}
        onPress={onCancel}>
        <TouchableOpacity
          activeOpacity={1}
          style={[styles.sheet, {backgroundColor: colors.surface}]}
          onPress={() => undefined}>
          <View style={[styles.handle, {backgroundColor: colors.n300}]} />
          {title ? (
            <Text
              style={[
                typography.caption,
                {color: colors.n600, textAlign: 'center', marginBottom: 6},
              ]}>
              {title}
            </Text>
          ) : null}
          {options.map(option => {
            const Icon = option.icon;
            const color = option.danger ? colors.error : colors.n900;
            return (
              <TouchableOpacity
                key={option.key}
                testID={`action-sheet-${option.key}`}
                style={styles.row}
                onPress={option.onPress}>
                <Icon size={17} color={color} />
                <Text
                  style={[
                    typography.bodyStrong,
                    {color, fontSize: 12.5, marginLeft: 8},
                  ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
          <View style={[styles.divider, {backgroundColor: colors.hairline}]} />
          <TouchableOpacity
            testID="action-sheet-cancel"
            style={styles.row}
            onPress={onCancel}>
            <Text
              style={[
                typography.button,
                {color: colors.n600, textAlign: 'center', flex: 1},
              ]}>
              {cancelLabel}
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(10,11,8,0.58)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 10,
  },
  row: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
});
