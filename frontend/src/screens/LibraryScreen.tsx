import React from 'react';
import {Library} from 'lucide-react-native';
import {PlaceholderScreen} from '../components/PlaceholderScreen';

/** Frame 03 · 서재 탭 (읽고 있는 책/읽은 책 목록 → Frame 03.1 상세) */
export function LibraryScreen() {
  return (
    <PlaceholderScreen
      icon={Library}
      title="서재"
      frameLabel="Frame 03"
      description={
        '읽고 있는 책 / 읽은 책 목록과\n책 상세(장소사진·소감·독서기간)가 여기에 들어갈 예정이에요.'
      }
    />
  );
}
