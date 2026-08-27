# 디자인 정합성 시나리오

프론트엔드 구현이 `design/`에서 받은 디자인 시스템·Hi-Fi 목업과 일치하는지 검증한다.
`design/`은 읽기 전용 근거 자료. 불일치는 리포트로만 넘긴다(수정 X).

## 근거 파일 (design/)

| 파일 | 역할 | 프론트 대응 |
|---|---|---|
| `color_chips.html` (v2, 쑥송편) | **기준 팔레트** — 라이트/다크 램프, 상태색, 포인트 4색 | `frontend/src/theme/colors.ts` |
| `typography_and_icons.html` (v1.2) | Pretendard 타입 스케일 + Lucide 아이콘 24종 | `frontend/src/theme/typography.ts` |
| `hifi_mockup_v1.html` (v1.6) | 화면별 Hi-Fi 목업(프레임 11+ / 라이트·다크 나란히) | `frontend/src/screens/*`, `components/*` |

> 각 파일 안의 `doc-note`(버전 changelog) 블록이 실제 소스. claude.ai 프로젝트 문서와 어긋날 수 있음.

---

## A. 디자인 토큰 대조 (자동, 정적) — 최우선

`colors.ts` / `typography.ts`의 상수 값을 design 파일의 `--var` 값과 1:1 비교.

| # | 항목 | 방법 | 통과 기준 |
|---|---|---|---|
| DC-T01 | primary 램프 p50~p900 (라이트) | hex 문자열 비교 | 10/10 완전 일치 |
| DC-T02 | primary 램프 (다크, d-p100~d-p700) | 〃 | 7단계 일치 |
| DC-T03 | neutral 램프 n50~n900 (라이트/다크) | 〃 | 일치 |
| DC-T04 | 상태색 success/warning/error/info (라이트/다크) | 〃 | 일치 |
| DC-T05 | 포인트 4색 chart1~4 (라이트/다크) | chart1=브랜드 p700, chart2~4=송편 분홍/치자/자색 | 일치 |
| DC-T06 | 시맨틱 토큰 surface/accentSolidBg/onAccentSolid/warnBg/warnText/hairline | `hifi_mockup_v1.html`의 `:root`/`.dark` 스코프 값과 비교 | 일치 |
| DC-T07 | 타입 스케일 font-size (display/h1/h2/h3/body/bodyStrong/caption/overline/button/stat) | 비교 | 10/10 일치 |
| DC-T08 | 타입 스케일 line-height / letter-spacing | 비교 | 일치 |
| DC-T09 | 폰트 패밀리 | Pretendard 5웨이트 번들 + `react-native-asset` 링크 안내 존재 | ✔ |
| DC-T10 | 아이콘 세트 | `lucide-react-native` 사용, 목업에서 쓰는 아이콘이 Lucide에 존재 | ✔ |
| DC-T11 | 다크 뉴트럴 램프 단조성 | n50이 램프의 극단(가장 어두움)인지 | n50 < n100 < ... (다크는 역순) |
| DC-T12 | 다크 앱 배경 | design `--d-surface-app`와 프론트가 화면 배경에 쓰는 값 비교 | 일치 |

## B. 화면별 구조 대조 (수동/반자동)

각 Hi-Fi 프레임 ↔ 대응 화면. "요소가 다 있는가 / 그룹핑·순서가 같은가 / 상태 변형을 다루는가".
픽셀 정합이 아니라 **구성 요소 체크리스트**.

| 프레임 | 대응 화면 | 확인 포인트 |
|---|---|---|
| Frame 01 로그인/온보딩 | `LoginScreen` | "콩닥책닥" 워드마크, 소셜 버튼 3종(카카오/구글/네이버) 순서·스타일, 캡슐 CTA |
| Frame 01.1 회원가입 | `SignupScreen` | 닉네임(필수)·성별·관심분야 칩 6종·독서모임 검색. 칩 다중선택 스타일 |
| Frame 01.2 회원가입 검증 에러 | `SignupScreen` | 닉네임 중복/누락 시 필드 에러 UI가 목업 v1.4 상태 세트와 동일한가 |
| Frame 02 일정 탭 | `ScheduleScreen` | 이번달 일정 카드, 캘린더 스트립, 오늘의 리딩 카드, 종 아이콘 |
| Frame 02.1 일정 상세 | (해당 화면 유무 확인) | |
| Frame 03 서재 목록 | `LibraryScreen` | 책 카드(표지·상태·완독일수 "N일" 표기), 빈 상태 CTA, 로딩 스켈레톤 |
| Frame 03.1 서재 상세 | `BookDetailScreen` | 표지/제목/저자/별점/소감/장소 사진, "이 책 공유하기" 캡슐 버튼, 탭바 없음 |
| Frame 04 공유 탭 | `ShareScreen` | 그룹 목록, 공유 범위 = iOS 리스트+체크마크 스타일(안드로이드 라디오 아님), 공유 이력 |
| Frame 05 프로필/대시보드 | `ProfileScreen` + `DashboardScreen` | 통계 카드, "이번 분기 리캡" 진입, 도넛(포인트 4색)·6개월 막대·하이라이트 카드 |
| Frame 05.2 프로필 편집 | `ProfileEditScreen` | 기존 값 프리필, 관심분야 통째 교체, 저장/취소 |
| Frame 08 책 검색/등록 | `BookSearchScreen` | 검색바, 결과 카드(표지·제목·저자·출판사), 빈/에러 상태, 모달 진입 |
| Frame 10 알림 목록 | (해당 화면 유무 확인) | |
| 상태 UI (07/07.1/09) | `EmptyState`/`LoadingSkeleton`/`NetworkError` 컴포넌트 | 목업 상태 세트와 대응 |
| 공통 | `MainTabs` | 하단 탭 4개(일정/서재/공유/프로필) 아이콘·활성색(p700)·블러 탭바 |
| 공통 | 다크모드 | 모든 화면이 `.dark` 팔레트로 전환, 마크업 동일 |
| 공통 | iOS 감성 (v1.3) | 헤어라인+그림자 카드, 캡슐 CTA, Dynamic Island는 목업 전용(앱 아님) |

## C. 시각 회귀 (도구 필요)

- **현재**: 사용자가 Android Studio 에뮬레이터(`android-studio-quail2-windows`)로 각 화면을
  띄워 목업과 눈으로 비교. 테스터는 `hifi_mockup_v1.html`을 브라우저로 렌더해 참조 이미지 제공 가능.
- **자동화(미도입)**: 에뮬레이터 스크린샷 ↔ 목업 프레임 픽셀 diff. FINDING: E2E 도구 결정은
  프론트↔백엔드 연동 후로 보류됨([requests/테스트코드작성요청_v1.md](../requests/테스트코드작성요청_v1.md)) —
  시각 회귀도 같은 시점에 함께 논의.

---

## 회귀 스모크

DC-T01, DC-T04, DC-T05, DC-T07 (토큰 핵심) + B의 "공통" 3줄(탭바/다크모드/iOS 감성).
