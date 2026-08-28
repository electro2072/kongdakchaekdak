import type {NotificationItem} from '../types/notification';

// TODO: GET /api/notifications 프론트 연동 전이라 Hi-Fi 목업(Frame 10,
// claude/독서기록앱_디자인시스템_Hifi목업_v1.md v1.3.2) 설명 그대로의 mock 데이터
// (신규 멤버 참여/공유 반응/일정 알림/월간 리캡 4건, 안 읽음 2건)를 사용한다.
export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    type: 'member',
    title: '새 멤버가 참여했어요',
    message: '독서모임 "책벙개"에 새 멤버가 들어왔어요',
    dateLabel: '방금 전',
    isRead: false,
  },
  {
    id: '2',
    type: 'reaction',
    title: '공유한 기록에 반응이 있어요',
    message: '『아몬드』 공유 카드에 좋아요가 달렸어요',
    dateLabel: '2시간 전',
    isRead: false,
  },
  {
    id: '3',
    type: 'schedule',
    title: '이번주 독서모임 일정 알림',
    message: '7월 20일(토) 14:00 · 독서모임 "책벙개"',
    dateLabel: '어제',
    isRead: true,
  },
  {
    id: '4',
    type: 'recap',
    title: '월간 리캡이 도착했어요',
    message: '7월 독서 대시보드를 확인해보세요',
    dateLabel: '3일 전',
    isRead: true,
  },
];
