/** 로그인 전 스택 (Frame 01 로그인 → Frame 01.1 회원가입) */
export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

/** 로그인 후 하단 탭 (기획서 3장 기준: 일정/서재/공유/프로필) */
export type MainTabParamList = {
  Schedule: undefined;
  Library: undefined;
  Share: undefined;
  Profile: undefined;
};

/**
 * 로그인 후 최상위 스택. 하단 탭(Tabs) 위에 책 상세(Frame 03.1) 등을 push해서
 * 탭바 없이 전체화면으로 보여준다 (와이어프레임상 Frame 03.1에는 탭바가 없음).
 */
export type MainStackParamList = {
  Tabs: undefined;
  BookDetail: {bookId: string};
};
