#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>

// 소셜 로그인 — 카카오톡/네이버 앱에서 로그인 후 이 앱으로 돌아오는 리다이렉트를 처리하는 데 필요.
// 정확한 헤더 경로는 `pod install` 이후 생성되는 실제 헤더 기준으로 미세하게 다를 수 있음 — 빌드
// 에러가 나면 Xcode 자동완성으로 정확한 경로를 확인해 교체할 것.
#import <RNKakaoLogins.h>
#import <NaverThirdPartyLogin/NaverThirdPartyLoginConnection.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"ReadingRecordApp";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

// 카카오톡/네이버 앱에서 로그인 완료 후 커스텀 URL 스킴으로 이 앱을 다시 열 때 호출됨.
// 아래 scheme은 Info.plist(CFBundleURLSchemes의 naver 항목)/.env의 NAVER_URL_SCHEME_IOS와
// 반드시 동일해야 함.
- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey, id> *)options
{
  if ([url.scheme isEqualToString:@"com.kongdakchaekdak"]) {
    return [[NaverThirdPartyLoginConnection getSharedInstance] application:application openURL:url options:options];
  }
  if ([RNKakaoLogins isKakaoTalkLoginUrl:url]) {
    return [RNKakaoLogins handleOpenUrl:url];
  }
  return NO;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end
