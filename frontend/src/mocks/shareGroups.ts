import type {ShareGroupOption} from '../types/share';

// TODO: GET /api/groups 프론트 연동 전이라 화면설계서(Frame 04) 그대로의 mock 데이터를 사용한다.
export const MOCK_SHARE_GROUPS: ShareGroupOption[] = [
  {id: '1', name: '독서모임', memberCount: 8},
  {id: '2', name: '가족', memberCount: 4},
];
