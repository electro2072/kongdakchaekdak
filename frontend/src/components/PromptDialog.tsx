import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useTheme} from '../theme';

/**
 * 입력형 다이얼로그 — claude/독서기록앱_프론트요청_디자인_소감작성화면_장소사진추가화면_v1.md
 * 디자인 회신(2026-09-07, `color_chips.html` v2.4 "14. 입력형 다이얼로그") 기준.
 *
 * `ConfirmDialog`와 스크림/카드/버튼 규칙은 동일하고, 본문 자리에 한 줄 입력 필드만 다르다.
 * 버튼 라벨은 "취소/확인"이 아니라 "건너뛰기"(입력 없이 계속 진행)/"저장" — 디자인 회신이
 * "취소는 아무 것도 안 함, 건너뛰기는 이 입력만 생략하고 계속 진행"이라는 의미 차이를 명시해서
 * 라벨을 구분했다. 장소 사진 라벨 입력에 쓰인다 — 입력 여부와 무관하게 어느 버튼을 눌러도
 * 사진 등록 자체는 계속 진행된다(라벨이 선택 입력이라서).
 */
export interface PromptDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  /** 입력 없이(또는 입력값 버리고) 계속 진행 */
  onSkip: () => void;
  /** 입력값을 저장하고 계속 진행 */
  onSave: () => void;
}

export function PromptDialog({
  visible,
  title,
  message,
  placeholder,
  value,
  onChangeText,
  onSkip,
  onSave,
}: PromptDialogProps) {
  const {colors, typography, radii} = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onSkip}>
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
          <TextInput
            testID="prompt-dialog-input"
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.n400}
            autoCorrect={false}
            spellCheck={false}
            textBreakStrategy="simple"
            style={[
              styles.input,
              {
                backgroundColor: colors.n50,
                borderColor: colors.n300,
                color: colors.n900,
                borderRadius: radii.sm,
              },
            ]}
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity
              testID="prompt-dialog-skip"
              style={[
                styles.button,
                {
                  backgroundColor: 'transparent',
                  borderWidth: 1,
                  borderColor: colors.n300,
                  borderRadius: radii.pill,
                },
              ]}
              onPress={onSkip}>
              <Text style={[typography.button, {color: colors.n700}]}>
                건너뛰기
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="prompt-dialog-save"
              style={[
                styles.button,
                {backgroundColor: colors.accentSolidBg, borderRadius: radii.pill},
              ]}
              onPress={onSave}>
              <Text style={[typography.button, {color: colors.onAccentSolid}]}>
                저장
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
    // 디자인 스펙 고정값 — ConfirmDialog/로딩 오버레이와 동일한 스크림을 재사용.
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
  input: {
    height: 40,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    marginTop: 14,
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
