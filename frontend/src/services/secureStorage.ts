import EncryptedStorage from 'react-native-encrypted-storage';

/**
 * accessToken 같은 세션 값의 저장소를 한 겹 감싼 얇은 인터페이스.
 *
 * AuthContext는 이 인터페이스만 알고 실제 백엔드는 몰라야, 저장 방식을 바꿀 때 이 파일 하나만
 * 고치면 된다.
 *
 * 구현은 EncryptedStorage(iOS Keychain / Android EncryptedSharedPreferences)다. 백엔드에
 * 리프레시 토큰이 없어서 accessToken 하나가 곧 세션 전체라, AsyncStorage 평문 저장은
 * 루팅·탈옥 단말이나 안드로이드 백업에서 그대로 새어나간다.
 *
 * ⚠️ 네이티브 모듈이다 — 테스터는 JS 번들 갱신이 아니라 **네이티브 재빌드**가 필요하다.
 *    (iOS는 `cd ios && pod install` 후 재빌드)
 * ⚠️ 테스트 환경에선 네이티브가 링크되지 않아 `__mocks__/react-native-encrypted-storage.js`의
 *    인메모리 목으로 매핑해 쓴다(jest.config.js).
 */
export interface SecureStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

const encryptedStorageBackend: SecureStorage = {
  getItem: key => EncryptedStorage.getItem(key).then(value => value ?? null),
  setItem: (key, value) => EncryptedStorage.setItem(key, value),
  removeItem: key => EncryptedStorage.removeItem(key),
};

export const secureStorage: SecureStorage = encryptedStorageBackend;

/**
 * 세션 accessToken 저장 키.
 *
 * 이전 키는 AsyncStorage에 쓰던 `@konggdak/accessToken`(오타)이다. 저장소 자체가 바뀌어서
 * 어차피 이어지지 않으므로 마이그레이션 없이 새 키로 간다 — 기존에 로그인해둔 단말은 재실행 시
 * 한 번 로그인 화면으로 떨어진다. 출시 전이라 이 편이 낫다.
 */
export const SECURE_KEY_ACCESS_TOKEN = '@kongdakchaekdak/accessToken';
