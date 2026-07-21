import React from 'react';
import {User} from 'lucide-react-native';
import {PlaceholderScreen} from '../components/PlaceholderScreen';

/** Frame 05 · 프로필 탭 (기본 프로필 + Frame 05.1 독서 대시보드 Recap 진입) */
export function ProfileScreen() {
  return (
    <PlaceholderScreen
      icon={User}
      title="프로필"
      frameLabel="Frame 05"
      description={
        '프로필 정보, 활동 요약,\n독서 대시보드(Recap) 진입이 여기에 들어갈 예정이에요.'
      }
    />
  );
}
