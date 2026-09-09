import type {NotificationItem} from '../types/notification';
import {t} from '../strings';

// TODO: GET /api/notifications 프론트 연동 전이라 Hi-Fi 목업(Frame 10,
// claude/독서기록앱_디자인시스템_Hifi목업_v1.md v1.3.2) 설명 그대로의 mock 데이터
// (신규 멤버 참여/공유 반응/일정 알림/월간 리캡 4건, 안 읽음 2건)를 사용한다.
export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    type: 'member',
    title: t('notification.memberJoinedTitle'),
    message: t('notification.memberJoinedMessage'),
    dateLabel: '방금 전',
    isRead: false,
  },
  {
    id: '2',
    type: 'reaction',
    title: t('notification.reactionTitle'),
    message: t('notification.reactionMessage'),
    dateLabel: '2시간 전',
    isRead: false,
  },
  {
    id: '3',
    type: 'schedule',
    title: t('notification.scheduleTitle'),
    message: t('notification.scheduleMessage'),
    dateLabel: '어제',
    isRead: true,
  },
  {
    id: '4',
    type: 'recap',
    title: t('notification.recapTitle'),
    message: t('notification.recapMessage'),
    dateLabel: '3일 전',
    isRead: true,
  },
];
