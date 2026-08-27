// react-native-config의 android autolinking 자동 감지가 이 프로젝트 조합에서 실패해서
// (npx react-native config 로 확인하면 android: null 로 나옴), 명시적으로 알려준다.
module.exports = {
  dependencies: {
    'react-native-config': {
      platforms: {
        android: {
          sourceDir: '../node_modules/react-native-config/android',
          packageImportPath: 'import com.lugg.RNCConfig.RNCConfigPackage;',
          packageInstance: 'new RNCConfigPackage()',
        },
      },
    },
  },
  // Pretendard 폰트 파일(assets/fonts/*.ttf) — iOS/Android 네이티브 프로젝트에 실제로 링크하려면
  // 로컬에서 `npx react-native-asset` 실행 필요 (Info.plist/UIAppFonts, Xcode 프로젝트 리소스,
  // android/app/src/main/assets/fonts/ 복사까지 이 명령 하나가 전부 처리한다).
  assets: ['./assets/fonts'],
};
