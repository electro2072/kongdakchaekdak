/** Frame 02.1 일정 상세 화면에서 보여주는 모임 정보 한 건. */
export interface MeetingDetail {
  groupName: string;
  dateLabel: string;
  timeLabel: string;
  location: string;
  participantCount: number;
  noteText: string;
}
