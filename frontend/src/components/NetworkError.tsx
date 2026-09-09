import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {WifiOff} from 'lucide-react-native';
import {useTheme} from '../theme';
import {t} from '../strings';

interface NetworkErrorProps {
  message?: string;
  onRetry?: () => void;
}

/**
 * 공통 네트워크 에러 상태 (design/hifi_mockup_v1.html Frame 09 기준).
 * 어느 화면의 API 호출이 실패하든 재사용할 수 있게 만든 공통 컴포넌트.
 */
export function NetworkError({
  message = t('state.networkError'),
  onRetry,
}: NetworkErrorProps) {
  const {colors, typography, radii} = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.iconBox, {backgroundColor: colors.p50}]}>
        <WifiOff size={24} color={colors.p400} />
      </View>
      <Text
        style={[
          typography.caption,
          {
            color: colors.n700,
            textAlign: 'center',
            marginBottom: onRetry ? 14 : 0,
          },
        ]}>
        {message}
      </Text>
      {onRetry ? (
        <TouchableOpacity
          style={[
            styles.retryButton,
            {borderColor: colors.p700, borderRadius: radii.md},
          ]}
          onPress={onRetry}>
          <Text style={[typography.button, {color: colors.p700}]}>
            {t('common.retry')}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 32,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  retryButton: {
    height: 36,
    borderWidth: 1,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
