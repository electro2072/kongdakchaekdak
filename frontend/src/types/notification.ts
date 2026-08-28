export type NotificationType = 'member' | 'reaction' | 'schedule' | 'recap';

/** Frame 10 알림 목록의 항목 한 건. */
export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  dateLabel: string;
  isRead: boolean;
}
