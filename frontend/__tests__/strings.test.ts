import {describe, expect, it} from '@jest/globals';
import {ko, t} from '../src/strings';

describe('문구 리소스', () => {
  it('키로 문구를 찾는다', () => {
    expect(t('library.title')).toBe('서재');
    expect(t('nav.tabs.profile')).toBe('프로필');
  });

  it('{자리표시자}에 값을 끼워 넣는다', () => {
    expect(t('library.photoCount', {count: 3})).toBe('사진 3장');
    expect(t('auth.login.welcomeToast', {nickname: '홍길동'})).toBe(
      '홍길동님, 환영해요!',
    );
  });

  it('값을 안 넘긴 자리표시자는 그대로 남긴다 — 원인을 찾기 쉽도록', () => {
    expect(t('library.photoCount')).toBe('사진 {count}장');
  });
});

describe('디자인 v1.17 "밥상" 보이스가 반영되어 있다', () => {
  it('완독 버튼에서 시스템 용어가 빠졌다', () => {
    expect(ko.bookDetail.completeButton).toBe('다 읽었어요');
  });

  it('완독 토스트에만 "책거리"를 쓴다', () => {
    expect(ko.bookDetail.completeSuccess).toContain('책거리');
  });

  it('서재·대시보드 빈 상태가 "상" 은유를 쓴다', () => {
    expect(ko.library.emptyTitle).toBe('아직 상이 비어 있어요');
    expect(ko.dashboard.emptyTitle).toBe('아직 상이 비어 있어요');
  });

  it('리캡 하이라이트가 입맛/뜸/뚝딱을 쓴다', () => {
    expect(ko.dashboard.highlightTopGenre).toContain('입맛');
    expect(ko.dashboard.highlightLongestRead).toContain('뜸 들여');
    expect(ko.dashboard.highlightFastestRead).toContain('뚝딱');
  });

  it('월간 리캡 알림이 "밥상"으로 바뀌었다', () => {
    expect(ko.notification.recapTitle).toBe('7월 밥상이 차려졌어요');
  });
});

describe('보이스 3원칙을 어기는 문구가 없다', () => {
  /** 리소스를 훑어 모든 문자열을 경로와 함께 뽑는다 */
  function flatten(node: unknown, path = ''): Array<[string, string]> {
    if (typeof node === 'string') {
      return [[path, node]];
    }
    if (typeof node !== 'object' || node === null) {
      return [];
    }
    return Object.entries(node).flatMap(([key, value]) =>
      flatten(value, path ? `${path}.${key}` : key),
    );
  }

  const entries = flatten(ko);

  it('선 3 금지어를 쓰지 않는다', () => {
    // 보이스 문서 §1 선 3. 특히 굶다·다이어트·폭식은 섭식 관련 표현이라 재미로도 쓰지 않는다.
    const banned = [
      '굶',
      '다이어트',
      '폭식',
      '과식',
      '편식',
      '배불',
      '배부',
      '체했',
      '맛없',
      '상했',
    ];
    const violations = entries.filter(([, text]) =>
      banned.some(word => text.includes(word)),
    );
    expect(violations).toEqual([]);
  });

  it('선 2 — 실패·경고·삭제 문구에는 음식 은유를 쓰지 않는다', () => {
    const metaphors = [
      '책거리',
      '콩송편',
      '밥상',
      '한 상',
      '입맛',
      '야금야금',
      '한 입',
      '두 모금',
      '뜸 들',
      '뚝딱',
      '나눠 먹',
      '군침',
    ];
    const failureKeys = entries.filter(([path]) => {
      const leaf = path.split('.').pop() ?? '';
      return (
        path.startsWith('failure.') ||
        /(Failure|Error|TooShort|Notice|delete|Delete|Denied|Unavailable)/.test(
          leaf,
        )
      );
    });
    // 실패 문구 자체가 존재하는지도 함께 확인 — 필터가 조용히 비면 이 검사가 무의미해진다
    expect(failureKeys.length).toBeGreaterThan(10);

    const violations = failureKeys.filter(([, text]) =>
      metaphors.some(word => text.includes(word)),
    );
    expect(violations).toEqual([]);
  });

  it('장르 라벨은 백엔드 Genre enum과 문자 단위로 일치한다', () => {
    // 화면 문구지만 동시에 마스터 데이터라, 리소스에서 고쳐도 여기서 걸린다.
    // '경제·경영'의 가운뎃점은 U+00B7 — 비슷하게 생긴 U+2022로 바뀌면 통신이 깨진다.
    expect(Object.values(ko.genre)).toEqual([
      '소설',
      '에세이',
      '자기계발',
      '인문',
      '과학',
      '경제·경영',
    ]);
    expect(ko.genre.business.charCodeAt(2)).toBe(0x00b7);
  });

  it('§2 — 탭·화면 제목은 은유 없이 직역으로 둔다', () => {
    expect(ko.nav.tabs.library).toBe('서재');
    expect(ko.nav.dashboard).toBe('독서 대시보드');
    expect(ko.profile.edit.interestsLabel).toBe('관심 분야');
  });
});
