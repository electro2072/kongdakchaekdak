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
