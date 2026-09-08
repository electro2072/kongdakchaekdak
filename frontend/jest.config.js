module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|@react-native-community|react-native-config|@react-navigation|react-native-screens|react-native-safe-area-context)',
  ],
  moduleNameMapper: {
    // lucide-react-native의 package.json exports는 "react-native"/"import" 조건에서 .mjs(ESM)를
    // 가리키는데, jest-preset의 transform 설정은 .mjs를 다루지 않아 파싱에 실패한다.
    // require() 조건이 가리키는 CJS 빌드로 강제 매핑해서 우회한다.
    '^lucide-react-native$': '<rootDir>/node_modules/lucide-react-native/dist/cjs/lucide-react-native.js',
    // AsyncStorage 네이티브 모듈은 테스트 환경에서 링크되지 않으므로, 패키지가 공식 제공하는
    // 인메모리 jest mock으로 강제 매핑한다(AuthContext.tsx 세션 영속화, 2026-09-08 추가).
    '^@react-native-async-storage/async-storage$':
      '@react-native-async-storage/async-storage/jest/async-storage-mock',
    // EncryptedStorage도 같은 이유(네이티브 모듈)로 인메모리 목으로 매핑한다 — 이쪽은 패키지가
    // 공식 mock을 제공하지 않아 __mocks__/에 직접 뒀다(services/secureStorage.ts 참고).
    '^react-native-encrypted-storage$':
      '<rootDir>/__mocks__/react-native-encrypted-storage.js',
  },
};
