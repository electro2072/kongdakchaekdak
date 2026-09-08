/**
 * @format
 */

import 'react-native';
import React from 'react';
import App from '../App';

// Note: import explicitly to use the types shipped with jest.
import {it} from '@jest/globals';

// Note: test renderer must be required after react-native.
import renderer, {act} from 'react-test-renderer';

/**
 * 2026-09-08 업데이트: `AuthProvider`가 마운트 시 AsyncStorage에서 세션을 복원하는 비동기
 * effect를 갖게 됐다(`isRestoring` → false). 예전처럼 `renderer.create(<App />)`만 동기로
 * 호출하고 끝내면, 그 상태 업데이트가 이 테스트 함수가 반환된 뒤(Jest가 이 파일의 환경을
 * 정리하기 시작한 뒤)에야 일어나면서 "Jest 환경이 정리된 뒤에 import를 시도했다" 같은
 * 워커 크래시로 이어진다 — `await act(async () => {...})`로 감싸 그 업데이트까지 흘려보낸
 * 뒤 명시적으로 unmount한다.
 */
it('renders correctly', async () => {
  let root: renderer.ReactTestRenderer | undefined;
  await act(async () => {
    root = renderer.create(<App />);
  });
  root?.unmount();
});
