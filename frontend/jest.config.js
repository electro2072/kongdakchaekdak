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
  },
};
