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
};
