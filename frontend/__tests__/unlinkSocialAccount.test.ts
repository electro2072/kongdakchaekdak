import {afterEach, beforeEach, describe, expect, it, jest} from '@jest/globals';
import {unlink as kakaoUnlink} from '@react-native-seoul/kakao-login';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import NaverLogin from '@react-native-seoul/naver-login';
import {
  SOCIAL_UNLINK_TIMEOUT_MS,
  unlinkSocialAccount,
} from '../src/services/socialAuth/unlinkSocialAccount';
import {mapSocialProviderResponse} from '../src/services/userApi';

/**
 * 회원 탈퇴(G16) 후 소셜 연결 해제 — best-effort 규칙.
 * 탈퇴 흐름 전체(서버 탈퇴 뒤에 호출되는지, 실패해도 로그인 화면으로 가는지)는
 * withdrawAccount.test.tsx가 본다. 여기서는 이 모듈 단독 규칙만 누른다.
 */
const kakao = kakaoUnlink as unknown as jest.Mock;
const google = GoogleSignin.revokeAccess as unknown as jest.Mock;
const naver = NaverLogin.deleteToken as unknown as jest.Mock;

describe('unlinkSocialAccount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // reject·보류로 바꾼 구현이 다음 테스트로 새지 않게 되돌린다(원래 구현 없는 jest.fn()).
    [kakao, google, naver].forEach(fn => fn.mockReset());
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('제공자별로 해당 SDK의 연결 해제만 호출한다', async () => {
    await unlinkSocialAccount('kakao');
    await unlinkSocialAccount('google');
    await unlinkSocialAccount('naver');

    expect(kakao).toHaveBeenCalledTimes(1);
    expect(google).toHaveBeenCalledTimes(1);
    expect(naver).toHaveBeenCalledTimes(1);
  });

  it('Apple(클라이언트 API 없음)·알 수 없는 제공자는 아무 SDK도 호출하지 않는다', async () => {
    await unlinkSocialAccount('apple');
    await unlinkSocialAccount(null);

    expect(kakao).not.toHaveBeenCalled();
    expect(google).not.toHaveBeenCalled();
    expect(naver).not.toHaveBeenCalled();
  });

  it('SDK가 reject해도 이 함수는 reject하지 않는다', async () => {
    google.mockImplementation(async () => {
      throw new Error('SIGN_IN_REQUIRED');
    });

    await expect(unlinkSocialAccount('google')).resolves.toBeUndefined();
  });

  it('SDK가 응답하지 않으면 시간 제한 뒤에 기다리기를 멈춘다', async () => {
    jest.useFakeTimers();
    naver.mockImplementation(() => new Promise<void>(() => {}));

    let settled = false;
    const pending = unlinkSocialAccount('naver').then(() => {
      settled = true;
    });

    await jest.advanceTimersByTimeAsync(SOCIAL_UNLINK_TIMEOUT_MS - 1);
    expect(settled).toBe(false);

    await jest.advanceTimersByTimeAsync(1);
    await pending;
    expect(settled).toBe(true);
  });
});

describe('mapSocialProviderResponse (API 경계)', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('백엔드 SocialAuthService 상수값을 프론트 키로 옮긴다', () => {
    expect(mapSocialProviderResponse('kakao')).toBe('kakao');
    expect(mapSocialProviderResponse('google')).toBe('google');
    expect(mapSocialProviderResponse('naver')).toBe('naver');
    expect(mapSocialProviderResponse('apple')).toBe('apple');
  });

  it('모르는 표기(예: G17 이후 대문자)는 추측하지 않고 null로 둔다', () => {
    expect(mapSocialProviderResponse('KAKAO')).toBeNull();
    expect(mapSocialProviderResponse('')).toBeNull();
    expect(mapSocialProviderResponse(null)).toBeNull();
  });
});
