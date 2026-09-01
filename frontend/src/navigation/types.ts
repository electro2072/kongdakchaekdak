import type {Book} from '../types/book';

/** 로그인 전 스택 (Frame 01 로그인 → Frame 01.1 회원가입) */
export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

/**
 * 로그인 후 하단 탭 (기획서 3장 기준: 일정/서재/공유/프로필).
 * Share는 서재 탭 책 상세(Frame 03.1)의 "이 책 공유하기" 버튼에서
 * bookId를 들고 진입할 수도, 탭을 직접 눌러 진입할 수도 있어 둘 다 optional.
 */
export type MainTabParamList = {
  Schedule: undefined;
  Library: undefined;
  Share: {bookId?: string} | undefined;
  Profile: undefined;
};

/**
 * 로그인 후 최상위 스택. 하단 탭(Tabs) 위에 책 상세(Frame 03.1) 등을 push해서
 * 탭바 없이 전체화면으로 보여준다 (와이어프레임상 Frame 03.1에는 탭바가 없음).
 */
export type MainStackParamList = {
  Tabs:
    | {
        screen?: keyof MainTabParamList;
        params?: MainTabParamList[keyof MainTabParamList];
      }
    | undefined;
  BookDetail: {bookId: string};
  /** Frame 03 책 검색/등록 — 일정 탭 "새 책 등록하기", 서재 탭 빈 상태 CTA에서 모달로 진입 */
  BookSearch: undefined;
  /**
   * Frame 08.2 책 등록 확인 — BookSearch(Frame 03)에서 검색 결과를 선택하면 진입, 장르를
   * 단일선택한 뒤 서재에 등록한다. 테스터 리포트 FINDING-20260828-08 반영.
   */
  BookRegisterConfirm: {book: Book};
  /** Frame 05.1 독서 대시보드(Recap) — 프로필 탭 "이번 분기 리캡 보기" 카드에서 진입, 탭바 없이 전체화면 */
  Dashboard: undefined;
  /** Frame 05.2 프로필 편집 — 프로필 탭 "프로필 편집" 버튼에서 진입, 탭바 없이 전체화면 */
  ProfileEdit: undefined;
  /**
   * Frame 04.1 그룹 관리 · 공유 이력 — 공유 탭 "그룹 관리 · 공유 이력" 카드에서 진입, 탭바 없이 전체화면.
   * 테스터 리포트 FINDING-20260828-10 반영.
   */
  GroupManagement: undefined;
  /**
   * Frame 02.1 일정 상세 — 일정 탭 "이번주 일정 카드"에서 진입, 탭바 없이 전체화면.
   * 테스터 리포트 FINDING-20260828-10 반영.
   */
  ScheduleDetail: undefined;
  /**
   * Frame 10 알림 목록 — 일정 탭 헤더 종 아이콘에서 진입, 탭바 없이 전체화면.
   * 테스터 리포트 FINDING-20260828-10 반영.
   */
  Notifications: undefined;
};
