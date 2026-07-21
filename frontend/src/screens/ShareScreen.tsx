import React from 'react';
import {Share2} from 'lucide-react-native';
import {PlaceholderScreen} from '../components/PlaceholderScreen';

/** Frame 04 · 공유 탭 (공유범위 선택, 공유 카드 미리보기, 그룹 관리, 공유 이력) */
export function ShareScreen() {
  return (
    <PlaceholderScreen
      icon={Share2}
      title="공유"
      frameLabel="Frame 04"
      description={
        '공유 범위 선택, 그룹 관리, 공유 이력이\n여기에 들어갈 예정이에요. (그룹/공유 API 준비 전이라 mock 데이터로 시작할 계획)'
      }
    />
  );
}
