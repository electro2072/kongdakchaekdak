import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import {describe, expect, it} from '@jest/globals';
import {getMockDashboard} from '../src/mocks/dashboard';
import type {DashboardPeriod} from '../src/types/api/dashboard';

/**
 * BUG-20260910-b01 대시보드 DTO 계약 테스트.
 *
 * 프론트 `types/api/dashboard.ts`가 `GenreRatioDto.ratio`·`BookHighlightDto.id`로 적혀 있었는데
 * 백엔드 record는 `percentage`·`bookId`였다. 화면에는 "NaN%"가 떴고, `mocks/dashboard.ts`도 같은
 * 틀린 키를 갖고 있어서 jest는 아무것도 못 잡았다 — 틀린 타입과 틀린 mock이 서로를 증명해준 셈이다.
 *
 * `apiErrorCodeContract.test.ts`와 같은 방식으로 **백엔드 소스 자체를 진실로 삼는다**(D15).
 * 세 층을 대조한다:
 *   1. BE record 컴포넌트명  ↔  FE interface 필드명      (타입이 틀리면 여기서 실패)
 *   2. BE `DashboardPeriod` 직렬화 값  ↔  FE `DashboardPeriodResponse`
 *   3. BE record 컴포넌트명  ↔  mock 객체의 실제 키        (jest는 tsc 없이 돌므로 mock을 따로 본다)
 *
 * 필드명만 본다. 타입(long ↔ number 등)·nullable 여부는 이 테스트 범위 밖이다.
 */

const DASHBOARD_JAVA_DIR = path.join(
  __dirname,
  '..',
  '..',
  'backend',
  'src',
  'main',
  'java',
  'com',
  'kongdakchaekdak',
  'domain',
  'dashboard',
);

const FE_DASHBOARD_TYPES_PATH = path.join(
  __dirname,
  '..',
  'src',
  'types',
  'api',
  'dashboard.ts',
);

/** 대조 대상. FE interface 이름을 BE record 이름과 똑같이 두고 있으므로 1:1로 쓴다. */
const RECORD_NAMES = [
  'DashboardResponse',
  'GenreRatioDto',
  'MonthlyTrendDto',
  'DashboardHighlights',
  'BookHighlightDto',
] as const;
type RecordName = (typeof RECORD_NAMES)[number];

/**
 * mock을 재귀로 따라 내려가기 위한 중첩 구조. BE record의 필드 타입을 옮겨 적은 것이다
 * (`List<GenreRatioDto> genreRatios` → 배열 원소가 GenreRatioDto).
 */
const NESTED: Partial<Record<RecordName, Record<string, RecordName>>> = {
  DashboardResponse: {
    genreRatios: 'GenreRatioDto',
    monthlyTrend: 'MonthlyTrendDto',
    highlights: 'DashboardHighlights',
  },
  DashboardHighlights: {
    longestReadBook: 'BookHighlightDto',
    fastestReadBook: 'BookHighlightDto',
  },
};

/** 읽기 실패를 삼키면 "비교 대상 0개라 통과"가 되므로 그대로 던진다. 경로만 덧붙인다. */
function readSource(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    throw new Error(
      `계약 대조용 소스를 읽지 못했습니다: ${filePath}\n` +
        '디렉터리 구조가 바뀌었다면 이 테스트 파일의 경로 상수를 갱신해주세요.\n' +
        `원본 에러: ${(error as Error).message}`,
    );
  }
}

/** 최상위(괄호·제네릭 밖) 쉼표로만 자른다. `Map<String, Long> x` 같은 컴포넌트를 쪼개지 않기 위해. */
function splitTopLevel(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of text) {
    if (ch === '(' || ch === '<') {
      depth++;
    } else if (ch === ')' || ch === '>') {
      depth--;
    }
    if (ch === ',' && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim() !== '') {
    parts.push(current);
  }
  return parts;
}

/**
 * `public record Name( ... )`의 컴포넌트 이름을 순서대로 뽑는다.
 * Jackson은 record 컴포넌트명을 그대로 JSON 키로 쓴다 — 단 `@JsonProperty`가 붙으면 달라지므로,
 * 그런 컴포넌트를 만나면 조용히 틀린 이름을 비교하지 않도록 실패시킨다.
 */
function extractRecordComponents(recordName: RecordName): string[] {
  const filePath = path.join(DASHBOARD_JAVA_DIR, 'dto', `${recordName}.java`);
  const source = readSource(filePath)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');

  const header = `public record ${recordName}(`;
  const start = source.indexOf(header);
  if (start === -1) {
    throw new Error(
      `${recordName}.java에서 "${header}"를 찾지 못했습니다 — record가 아니게 됐거나 ` +
        '이름이 바뀐 것으로 보입니다. 이 테스트의 파싱 로직을 갱신해주세요.',
    );
  }

  let depth = 1;
  let i = start + header.length;
  for (; i < source.length && depth > 0; i++) {
    if (source[i] === '(') {
      depth++;
    } else if (source[i] === ')') {
      depth--;
    }
  }
  const body = source.slice(start + header.length, i - 1);

  return splitTopLevel(body).map(component => {
    if (component.includes('@JsonProperty')) {
      throw new Error(
        `${recordName}의 컴포넌트에 @JsonProperty가 있습니다: "${component.trim()}" — JSON 키가 ` +
          '컴포넌트명과 달라지므로 이 테스트가 그 값을 읽도록 갱신해야 합니다.',
      );
    }
    const withoutAnnotations = component
      .replace(/@\w+(\([^)]*\))?/g, '')
      .trim();
    const tokens = withoutAnnotations.split(/\s+/);
    return tokens[tokens.length - 1];
  });
}

/** `DashboardPeriod.java`가 실제로 JSON에 쓰는 값. `@JsonValue`가 소문자 변환임을 먼저 확인한다. */
function extractSerializedDashboardPeriods(): string[] {
  const source = readSource(
    path.join(DASHBOARD_JAVA_DIR, 'DashboardPeriod.java'),
  );

  const jsonValueMethod = source.match(
    /@JsonValue\s+public\s+String\s+\w+\(\)\s*\{([\s\S]*?)\}/,
  );
  if (
    !jsonValueMethod ||
    !/name\(\)\.toLowerCase\(\)/.test(jsonValueMethod[1])
  ) {
    throw new Error(
      'DashboardPeriod.java의 @JsonValue가 `name().toLowerCase()`가 아니게 됐습니다 — 응답 `period`의 ' +
        '직렬화 규칙이 바뀐 것이니 FE DashboardPeriodResponse와 이 테스트를 함께 갱신해주세요.',
    );
  }

  const enumBody = source.match(
    /public\s+enum\s+DashboardPeriod\s*\{([\s\S]*?);/,
  );
  if (!enumBody) {
    throw new Error(
      'DashboardPeriod.java에서 enum 상수 선언부를 찾지 못했습니다.',
    );
  }
  return enumBody[1]
    .split(',')
    .map(name => name.trim())
    .filter(name => name !== '')
    .map(name => name.toLowerCase());
}

const feTypesSource = ts.createSourceFile(
  FE_DASHBOARD_TYPES_PATH,
  readSource(FE_DASHBOARD_TYPES_PATH),
  ts.ScriptTarget.Latest,
  true,
);

/** 정규식 대신 컴파일러 API로 interface 필드명을 뽑는다 — 주석·옵셔널 표기에 흔들리지 않게. */
function extractInterfaceFields(interfaceName: string): string[] {
  const declaration = feTypesSource.statements.find(
    (node): node is ts.InterfaceDeclaration =>
      ts.isInterfaceDeclaration(node) && node.name.text === interfaceName,
  );
  if (!declaration) {
    throw new Error(
      `types/api/dashboard.ts에 interface ${interfaceName}가 없습니다.`,
    );
  }
  return declaration.members
    .filter(ts.isPropertySignature)
    .map(member => member.name.getText(feTypesSource));
}

function extractStringUnion(typeAliasName: string): string[] {
  const declaration = feTypesSource.statements.find(
    (node): node is ts.TypeAliasDeclaration =>
      ts.isTypeAliasDeclaration(node) && node.name.text === typeAliasName,
  );
  if (!declaration || !ts.isUnionTypeNode(declaration.type)) {
    throw new Error(
      `types/api/dashboard.ts에 문자열 유니언 type ${typeAliasName}가 없습니다.`,
    );
  }
  return declaration.type.types.map(member => {
    if (!ts.isLiteralTypeNode(member) || !ts.isStringLiteral(member.literal)) {
      throw new Error(
        `${typeAliasName}에 문자열 리터럴이 아닌 멤버가 있습니다.`,
      );
    }
    return member.literal.text;
  });
}

const sorted = (values: string[]) => [...values].sort();

/**
 * mock 객체의 키가 BE record 컴포넌트와 정확히 같은지 재귀로 확인한다.
 * 실패 메시지에 경로(`month.highlights.longestReadBook`)를 남겨 어느 칸이 틀렸는지 바로 보이게 한다.
 */
function collectMockKeyMismatches(
  value: unknown,
  recordName: RecordName,
  where: string,
): string[] {
  if (value === null) {
    return [];
  }
  const mismatches: string[] = [];
  const expected = sorted(extractRecordComponents(recordName));
  const actual = sorted(Object.keys(value as object));
  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    mismatches.push(
      `${where} (${recordName}): BE=[${expected.join(
        ', ',
      )}] / mock=[${actual.join(', ')}]`,
    );
  }
  for (const [field, childRecord] of Object.entries(NESTED[recordName] ?? {})) {
    const child = (value as Record<string, unknown>)[field];
    const children = Array.isArray(child) ? child : [child];
    children.forEach((item, index) => {
      const childWhere = Array.isArray(child)
        ? `${where}.${field}[${index}]`
        : `${where}.${field}`;
      mismatches.push(
        ...collectMockKeyMismatches(item, childRecord, childWhere),
      );
    });
  }
  return mismatches;
}

describe('BUG-b01 대시보드 DTO 계약 — backend record ↔ types/api/dashboard.ts ↔ mocks/dashboard.ts', () => {
  it('BE record를 실제로 파싱해낸다 (0개면 아래 대조가 무의미해지므로 별도 확인)', () => {
    for (const recordName of RECORD_NAMES) {
      expect(extractRecordComponents(recordName).length).toBeGreaterThan(0);
    }
  });

  it.each(RECORD_NAMES)(
    'FE interface %s의 필드명이 BE record 컴포넌트와 정확히 같다',
    recordName => {
      expect(sorted(extractInterfaceFields(recordName))).toEqual(
        sorted(extractRecordComponents(recordName)),
      );
    },
  );

  it('FE DashboardPeriodResponse가 BE DashboardPeriod의 직렬화 값(소문자)과 같다', () => {
    expect(sorted(extractStringUnion('DashboardPeriodResponse'))).toEqual(
      sorted(extractSerializedDashboardPeriods()),
    );
  });

  it('mocks/dashboard.ts의 모든 기간 응답이 BE record와 같은 키를 갖는다 (중첩 포함)', () => {
    const periods: DashboardPeriod[] = ['month', 'quarter', 'year'];
    const mismatches = periods.flatMap(period =>
      collectMockKeyMismatches(
        getMockDashboard(period),
        'DashboardResponse',
        period,
      ),
    );
    expect(mismatches).toEqual([]);
  });

  it('mocks/dashboard.ts의 period 값이 BE 직렬화 값 중 하나다', () => {
    const serialized = extractSerializedDashboardPeriods();
    const periods: DashboardPeriod[] = ['month', 'quarter', 'year'];
    for (const period of periods) {
      expect(serialized).toContain(getMockDashboard(period).period);
    }
  });
});
