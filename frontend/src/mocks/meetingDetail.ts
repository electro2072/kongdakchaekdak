import type {MeetingDetail} from '../types/schedule';

// TODO: GET /api/groups/{id}/meetings 프론트 연동 전이라 Hi-Fi 목업(Frame 02.1,
// claude/독서기록앱_디자인시스템_Hifi목업_v1.md v1.3.2) 설명 그대로의 mock 데이터를 사용한다.
// ScheduleScreen의 UPCOMING_MEETING(그룹명/일시)과 같은 모임을 가리킨다.
export const MOCK_MEETING_DETAIL: MeetingDetail = {
  groupName: '책벙개',
  dateLabel: '7월 20일(토)',
  timeLabel: '14:00',
  location: '홍대입구역 인근 카페',
  participantCount: 8,
  noteText:
    '이번 모임에서는 『아몬드』 완독 소감을 나눌 예정이에요. 편하게 참여해주세요!',
};
