import React from 'react';
import {Text} from 'react-native';
import {Circle} from 'react-native-svg';
import renderer, {act, type ReactTestRenderer} from 'react-test-renderer';
import {describe, expect, it} from '@jest/globals';
import {GenreDonutChart} from '../src/components/dashboard/GenreDonutChart';
import {getMockDashboard} from '../src/mocks/dashboard';

/**
 * BUG-20260910-b01 회귀 테스트 — 실기기에서 범례가 "소설 NaN%"로, 도넛은 호 없이 단색 링으로 보였다.
 * 원인은 DTO 필드명(`ratio` ↔ BE `percentage`). 필드명 자체는 dashboardDtoContract.test.ts가 보고,
 * 여기서는 **사용자가 본 증상**(범례 퍼센트, 호의 strokeDasharray)을 직접 확인한다.
 */

function render(
  genreRatios: Parameters<typeof GenreDonutChart>[0]['genreRatios'],
): ReactTestRenderer {
  let tree: ReactTestRenderer | undefined;
  act(() => {
    tree = renderer.create(<GenreDonutChart genreRatios={genreRatios} />);
  });
  return tree as ReactTestRenderer;
}

function allText(tree: ReactTestRenderer): string[] {
  return tree.root
    .findAllByType(Text)
    .map(node => [node.props.children].flat().join(''));
}

describe('GenreDonutChart — BUG-b01 NaN% 회귀', () => {
  it('범례에 백엔드 percentage를 반올림한 값이 표시되고 NaN이 없다', () => {
    // month mock: 소설 66.7 / 에세이 33.3
    const tree = render(getMockDashboard('month').genreRatios);
    const texts = allText(tree);

    expect(texts).toContain('67%');
    expect(texts).toContain('33%');
    expect(texts.join(' ')).not.toContain('NaN');
  });

  it('장르마다 호(arc)가 그려지고 strokeDasharray/offset에 NaN이 없다', () => {
    const genreRatios = getMockDashboard('quarter').genreRatios; // 4개 장르
    const circles = render(genreRatios).root.findAllByType(Circle);

    expect(circles).toHaveLength(genreRatios.length);
    for (const circle of circles) {
      expect(String(circle.props.strokeDasharray)).not.toContain('NaN');
      expect(Number.isNaN(Number(circle.props.strokeDashoffset))).toBe(false);
    }
    // 첫 호의 길이가 비율에 비례한다 — 45.5%면 둘레의 45.5%. "단색 링"(호 없음)이 아님을 수치로 확인.
    const [firstLength, firstGap] = String(circles[0].props.strokeDasharray)
      .split(' ')
      .map(Number);
    expect(firstLength / (firstLength + firstGap)).toBeCloseTo(0.455, 3);
  });

  it('완독 0권(genreRatios 빈 배열)이면 빈 링 1개와 안내 문구만 보인다', () => {
    const tree = render(getMockDashboard('year').genreRatios);

    expect(tree.root.findAllByType(Circle)).toHaveLength(1);
    expect(allText(tree).join(' ')).not.toContain('%');
  });
});
