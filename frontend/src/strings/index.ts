import {ko} from './ko';

/**
 * UI 문구 조회 헬퍼.
 *
 * 화면 코드는 문자열 리터럴 대신 이 모듈의 `t()`만 쓴다.
 *
 *   t('library.title')                        // → '서재'
 *   t('library.photoCount', {count: 3})       // → '사진 3장'
 *
 * 다국어(i18n)는 현재 범위 밖이라 로케일 개념 없이 `ko` 하나만 참조한다.
 * 나중에 필요해지면 같은 모양의 `en.ts`를 만들고 아래 `resource` 선택 부분에만
 * 로케일 분기를 추가하면 되며, 화면 코드는 그대로 둘 수 있다.
 */

/**
 * 리소스 객체를 점 표기 문자열 유니온으로 펼친다.
 * 예: 'library.title' | 'library.photoCount' | ...
 *
 * 이 타입 덕분에 오타나 삭제된 키는 런타임이 아니라 `tsc` 단계에서 잡힌다.
 */
type Paths<T> = T extends string
  ? ''
  : {
      [K in keyof T & string]: Paths<T[K]> extends infer R extends string
        ? R extends ''
          ? K
          : `${K}.${R}`
        : never;
    }[keyof T & string];

/** 리소스에 실제로 존재하는 문구 키만 허용하는 타입 */
export type StringKey = Paths<typeof ko>;

/** `{name}` 자리표시자에 끼워 넣을 값 */
export type StringParams = Record<string, string | number>;

const resource: Record<string, unknown> = ko;

/** `{name}` 형태의 자리표시자를 찾는 패턴 */
const PLACEHOLDER_PATTERN = /\{(\w+)\}/g;

function resolve(key: string): string | undefined {
  let current: unknown = resource;
  for (const segment of key.split('.')) {
    if (typeof current !== 'object' || current === null) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return typeof current === 'string' ? current : undefined;
}

/**
 * 문구를 키로 조회한다.
 *
 * 키가 없으면 앱을 죽이지 않고 키 문자열을 그대로 돌려준다 — 문구 하나가 빠졌다고
 * 화면 전체가 멈추는 것보다, 화면에 키가 노출되어 바로 눈에 띄는 쪽이 낫다.
 * 개발 빌드에서는 콘솔 경고도 함께 남긴다.
 *
 * 자리표시자에 값을 넘기지 않으면 `{name}` 그대로 남는다 — 빈 문자열로 지우면
 * 문장이 어색하게 끊겨 원인을 찾기 어렵기 때문에 일부러 남긴다.
 */
export function t(key: StringKey, params?: StringParams): string {
  const template = resolve(key);

  if (template === undefined) {
    if (__DEV__) {
      console.warn(`[strings] 등록되지 않은 문구 키: ${key}`);
    }
    return key;
  }

  if (!params) {
    return template;
  }

  return template.replace(PLACEHOLDER_PATTERN, (matched, name: string) => {
    const value = params[name];
    return value === undefined ? matched : String(value);
  });
}

export {ko};
