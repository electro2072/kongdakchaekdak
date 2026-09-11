import type {SocialProvider} from '../../types/api/auth';
import {logger} from '../../utils/logger';
import {revokeGoogleAccess} from './googleAuth';
import {unlinkKakao} from './kakaoAuth';
import {unlinkNaver} from './naverAuth';

/**
 * 연결 해제를 기다리는 최대 시간. 시간이 지나도 SDK 호출 자체를 취소하지는 않는다 — 기다리기만
 * 멈추고 탈퇴 흐름을 이어간다. 정상 응답은 보통 1초 안쪽이라, 멈춘 SDK 때문에 사용자가
 * 로그인 화면으로 못 넘어가는 시간을 이 값으로 상한을 둔다.
 */
export const SOCIAL_UNLINK_TIMEOUT_MS = 3000;

/**
 * Apple은 앱(클라이언트)에서 부를 수 있는 연결 해제 API가 없다. Apple 계정 삭제 요건(5.1.1(v))의
 * 토큰 회수는 서버가 Apple REST `/auth/revoke`로 해야 하는 일이라 FE에서는 호출하지 않는다.
 * (백엔드 전달 항목 — G16 보고서 참고. iOS 출시는 D5로 연기되어 Android 선출시에는 영향 없음.)
 */
const UNLINK_BY_PROVIDER: Record<SocialProvider, (() => Promise<void>) | null> =
  {
    kakao: unlinkKakao,
    google: revokeGoogleAccess,
    naver: unlinkNaver,
    apple: null,
  };

/**
 * 회원 탈퇴(G16) 후 소셜 제공자 쪽 연결을 끊는다. **best-effort — 이 함수는 절대 reject하지 않는다.**
 *
 * 실패해도 탈퇴는 이미 서버에서 끝났고, 남은 연결은 사용자가 각 서비스의 "연결된 앱 관리"에서
 * 끊을 수 있다고 `ACCOUNT_DELETION.md` "참고"에 이미 안내돼 있다. 그래서 실패·시간 초과는
 * 경고 로그만 남기고 조용히 넘어간다.
 */
export async function unlinkSocialAccount(
  provider: SocialProvider | null,
): Promise<void> {
  const unlink = provider ? UNLINK_BY_PROVIDER[provider] : null;
  if (!unlink) {
    logger.info(
      'unlinkSocialAccount',
      '앱에서 해제할 소셜 연결 없음 — 건너뜀',
      {
        provider,
      },
    );
    return;
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<'timeout'>(resolve => {
    timer = setTimeout(() => resolve('timeout'), SOCIAL_UNLINK_TIMEOUT_MS);
  });

  try {
    const result = await Promise.race([
      unlink().then(() => 'done' as const),
      timeout,
    ]);
    if (result === 'timeout') {
      logger.warn(
        'unlinkSocialAccount',
        '소셜 연결 해제 응답 없음 — 기다리지 않고 진행',
        {
          provider,
        },
      );
    } else {
      logger.info('unlinkSocialAccount', '소셜 연결 해제 완료', {provider});
    }
  } catch (error) {
    logger.warn(
      'unlinkSocialAccount',
      '소셜 연결 해제 실패 — 탈퇴는 계속 진행',
      {
        provider,
        error,
      },
    );
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}
