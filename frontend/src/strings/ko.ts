/**
 * 콩닥책닥 UI 문구 리소스 (한국어)
 *
 * ── 이 파일의 역할 ─────────────────────────────────────────────
 * 앱 화면에 노출되는 모든 문자열의 유일한 출처(single source of truth)다.
 * 화면/컴포넌트 코드는 문자열을 직접 쓰지 않고 `t('키.경로')`로만 호출한다.
 *
 * 디자인이 문구를 바꾸면 이 파일 한 곳만 고치면 되고, 화면 코드는 건드리지 않는다.
 * 2026-09-09 스크럼에서 리스크로 잡힌 "UX 문구 이중 관리" 해소가 목적이며,
 * 보이스 문서 §6이 요구한 `constants/messages.ts` 분리에 해당한다.
 *
 * ── 기준 문서 ──────────────────────────────────────────────────
 *   · 콩닥책닥_보이스확장_밥상레이어.md      ← 문구의 최종 기준
 *   · design/hifi_mockup_v1.html v1.17/v1.18 (커밋 1d5d3c1)
 * 아래 값은 보이스 문서 §4 대조표에서 굵게 표시된 안(또는 "담백안 유지"로 명시된
 * 안)을 그대로 옮긴 것이다. 임의로 지어낸 문구는 없으며, 문서에 없는 자리는
 * 기존 문구를 유지하고 `[문서 미수록]` 주석을 달았다.
 *
 * ── 규칙 ───────────────────────────────────────────────────────
 * 1. 값은 문자열 리터럴만 쓴다. 함수·조건식을 넣지 않는다 —
 *    비개발자(디자이너/기획자)가 직접 열어 고칠 수 있어야 한다.
 * 2. 동적 값은 `{중괄호}` 자리표시자로 넣는다. 예: '{nickname}님, 환영해요!'
 *    → `t('auth.login.welcomeToast', {nickname: '홍길동'})`
 * 3. 조사는 문구에 박아 넣지 않고 `{josa}` 자리표시자로 두고, 화면에서
 *    `utils/josa.ts`의 `josa(값, '을/를')` 결과를 넘긴다 (보이스 문서 §6).
 * 4. 키 이름은 화면(스크린) 단위로 묶고, 그 안에서 용도별로 나눈다.
 * 5. 다국어(i18n)는 현재 범위 밖이다. 나중에 필요해지면 이 파일과 같은 모양의
 *    `en.ts`를 만들고 `strings/index.ts`의 로케일 선택만 추가하면 된다.
 *    단, 보이스 문서 §6대로 `야금야금`·`두 모금`·`뜸 들이다`·`뚝딱`은 번역이
 *    불가능하므로 해당 언어에서는 담백안으로 폴백해야 한다.
 *
 * ── 보이스 3원칙 (보이스 문서 §1) ──────────────────────────────
 *   선 1. 빈도가 높을수록 담백하게 — 매번 보는 문구에 은유를 넣지 않는다.
 *   선 2. 잘 됐을 때만 맛을 낸다 — 실패·경고·삭제·권한·약관에는 은유 금지.
 *   선 3. 읽은 양을 음식으로 평가하지 않는다.
 *         금지어: 굶다·다이어트·폭식·과식·편식·배부르다·그만 먹다·
 *                 소화 못 하다·체하다·맛없다·상하다
 *   §2. 탭·버튼·필드 label·화면 제목은 은유 없이 직역으로 고정한다.
 *
 * 아래 주석의 `[맛]`은 은유를 허용한 자리, `[담백]`은 원칙상 은유를 금지한
 * 자리를 뜻한다. 문구를 고칠 때 이 표시를 먼저 확인할 것.
 */
export const ko = {
  /** 여러 화면에서 공통으로 쓰는 버튼·상태 라벨 — §2에 따라 전부 직역 고정 */
  common: {
    cancel: '취소',
    confirm: '확인',
    save: '저장',
    saving: '저장하는 중…',
    saveAction: '저장하기',
    delete: '삭제하기',
    edit: '수정하기',
    skip: '건너뛰기',
    later: '나중에 할게요',
    retry: '다시 시도',
    search: '검색',
    add: '추가',
    manage: '관리',
    multiSelect: '중복선택',
    optional: '선택',
    loading: '불러오는 중…',
  },

  /** 네비게이션 헤더 타이틀 · 탭 라벨 — §2 직역 고정 자리 */
  nav: {
    signup: '회원가입',
    bookDetailFallback: '책 상세',
    bookSearch: '책 검색',
    bookRegisterConfirm: '책 등록 확인',
    bookNoteCreate: '소감 작성',
    bookNoteEdit: '소감 수정',
    dashboard: '독서 대시보드',
    profileEdit: '프로필 편집',
    groupManagement: '그룹 관리 · 공유 이력',
    scheduleDetail: '일정 상세',
    notification: '알림',
    tabs: {
      schedule: '일정',
      library: '서재',
      share: '공유',
      profile: '프로필',
    },
  },

  /** 인증 — Frame 01(로그인/온보딩), Frame 01.1(회원가입) */
  auth: {
    login: {
      appName: '콩닥책닥',
      /** 앱 아이콘 배지의 두 줄 워드마크 */
      logoLine1: '콩닥',
      logoLine2: '책닥',
      /** 스토어 캡션으로 확정된 문구 — 보이스 문서에서 "건드리지 않습니다"로 못박음 */
      tagline: '오늘 읽은 한 페이지를 자랑해보세요',
      /**
       * [맛] 로그인 보조 문구 (보이스 문서 §4 온보딩 표 "로그인 보조").
       * ⚠️ 아직 화면에 붙이지 않았다 — 목업 v1.18 Frame 01에는 이 줄이 없어서,
       * 태그라인 아래에 실제로 넣을지는 디자인 확인이 필요하다.
       */
      taglineSub: '한 입씩 야금야금, 그래도 쌓여요',
      /**
       * Apple 로그인 버튼은 SDK가 제공하는 네이티브 `AppleButton` 컴포넌트를 쓴다
       * (App Store 심사에서 버튼 디자인 규정을 실제로 확인하기 때문).
       * 라벨도 SDK가 그리므로 이 키는 참고용으로만 남긴다 — 화면에서 쓰지 않는다.
       */
      appleButton: 'Apple로 로그인',
      naverButton: '네이버로 시작하기',
      kakaoButton: '카카오로 시작하기',
      googleButton: 'Google로 시작하기',
      /** [문서 미수록] 기존 문구 유지 */
      welcomeToast: '{nickname}님, 환영해요!',
      /** [담백] 실패 문구 — 선 2에 따라 은유 금지 */
      failureTitle: '로그인 실패',
      failureMessage: '잠시 후 다시 시도해주세요.',
    },
    /** 소셜 제공자 표시명 — 로그 메시지에 끼워 쓴다 */
    provider: {
      apple: '애플',
      naver: '네이버',
      kakao: '카카오',
      google: '구글',
    },
    signup: {
      title: '몇 가지만 알려주세요',
      subtitle: '닉네임 외 모든 정보는 선택이에요',
      /** §2 — 필드 label은 직역 고정 */
      nicknameLabel: '닉네임 (필수)',
      nicknameHint: '{min}~{max}자, 한글/영문/숫자만',
      nicknamePlaceholder: '닉네임을 입력해주세요',
      /** [담백] 입력 검증 실패 — 선 2 */
      nicknameTooShort: '닉네임은 {min}자 이상 입력해주세요',
      genderLabel: '성별',
      interestsLabel: '관심 분야',
      groupLabel: '속한 독서모임이 있나요?',
      groupPlaceholder: '모임 이름으로 검색',
      submit: '시작하기',
      /**
       * [맛] 가입 완료 다이얼로그 — 평생 한 번 보는 자리라 선 1에 따라 진하게.
       * 보이스 문서 §4 "맛있는 안": 어서 오세요! / 첫 술은 가볍게 — … /
       * 나중에 할게요 / 책 고르러 가기
       */
      welcomeDialogTitle: '어서 오세요!',
      welcomeDialogMessage: '첫 술은 가볍게 — 책 한 권만 올려볼까요?',
      welcomeDialogConfirm: '책 고르러 가기',
    },
  },

  /**
   * 장르(= 관심 분야) 6종.
   *
   * ⚠️ 이 6개는 다른 문구와 성격이 다르다 — 화면에 보이는 라벨인 동시에
   * **백엔드 `domain/common/Genre.java`의 enum 라벨과 문자 단위로 일치해야 하는
   * 마스터 데이터**다(개발현황.md 28번 항목). 값이 어긋나면 책 등록·프로필 저장이
   * 서버에서 거부된다.
   *
   * 특히 '경제·경영'의 가운뎃점은 U+00B7(·)이다. 비슷하게 생긴 U+2022(•)나
   * 마침표로 바꾸면 통신이 깨진다.
   *
   * 톤을 다듬고 싶더라도 여기서 임의로 고치지 말고 백엔드와 함께 바꿀 것.
   * `__tests__/profileOptions.test.ts`가 이 6개 값을 그대로 고정해 두었으므로,
   * 잘못 고치면 테스트가 먼저 실패한다.
   *
   * §2에 따라 이 라벨들은 은유 없이 직역으로 고정된다 — '관심 분야'를 '입맛'으로
   * 바꾸지 않는 것과 같은 이유다.
   */
  genre: {
    novel: '소설',
    essay: '에세이',
    selfHelp: '자기계발',
    humanities: '인문',
    science: '과학',
    business: '경제·경영',
  },

  /** 서재 — Frame 03(목록), Frame 07(빈 상태) */
  library: {
    title: '서재',
    filterReading: '읽고 있는 책',
    filterDone: '읽은 책',
    searchPlaceholder: '책 제목으로 검색',
    sortRecent: '최근순 ▾',
    /** §2 — 버튼 라벨은 직역 고정 */
    registerBook: '서재에 책 등록하기',
    photoCount: '사진 {count}장',
    noPhoto: '사진 없음',
    hasNote: '소감 있음',
    noNote: '소감 없음',
    /**
     * [맛] 서재에 책이 한 권도 없는 최초 빈 상태(Frame 07).
     * 목업 v1.17 · 보이스 문서 §4 서재 표와 동일.
     */
    emptyTitle: '아직 상이 비어 있어요',
    emptyDescription: '한 권만 올려도\n서재가 시작돼요',
    /** [담백] 검색·필터 결과 없음 — 실패 상태라 선 2에 따라 담백안 유지 */
    noMatchTitle: '찾는 책이 없어요',
    noMatchDescription: '검색어나 필터를 바꿔보세요',
    /**
     * [맛] "읽을 예정" 상태 빈 화면.
     * ⚠️ 현재 서재 필터는 읽는 중/읽은 책 2종뿐이라 아직 쓰이지 않는다.
     * 읽을 예정 필터가 생기면 이 키를 연결할 것.
     */
    plannedEmptyTitle: '아직 안 뜯은 책이 없네요',
    plannedEmptyDescription: '군침 도는 책을 미리 담아두세요',
  },

  /** 책 상세 — Frame 03.1 */
  bookDetail: {
    /** [담백] 오류 상태 */
    notFound: '책 정보를 찾을 수 없어요',
    readPeriodLabel: '읽은 기간',
    placePhotoLabel: '장소 사진',
    placePhotoHint: '사진을 길게 누르면 삭제할 수 있어요',
    /** §2 — 섹션 label은 직역 고정 */
    noteSectionLabel: '소감',
    writeNote: '소감 작성하기',
    /** [맛] 보이스 문서 §4 책 상세 표 "소감 없음" */
    noNoteTitle: '아직 소감이 없어요',
    noNoteDescription: '한 줄이라도 남겨두면 나중에 반가워요',
    /**
     * §2 — 버튼 라벨은 직역 고정. 보이스 문서가 "담백안 유지"로 명시.
     * v1.17에서 '다 읽었어요 (완독 처리)' → '다 읽었어요'로 간결화.
     */
    completeButton: '다 읽었어요',
    completeButtonBusy: '기록하는 중…',
    shareButton: '이 책 공유하기',
    /**
     * [맛] 완독 토스트 — 연 2~3권 읽는 페르소나에게는 1년에 몇 번뿐이라
     * 선 1에 따라 진하게 써도 되는 자리. `책거리`는 브랜드 고유어라
     * 완독·마일스톤에서만 쓴다(§3).
     */
    completeSuccess: '책거리! 완독으로 기록했어요',
    /** [담백] 아래 실패 문구는 전부 선 2 적용 자리 */
    completeFailure: '완독 처리에 실패했어요. 다시 시도해주세요.',
    detailLoadFailure: '소감과 사진을 불러오지 못했어요',
    photo: {
      takePhoto: '카메라로 촬영',
      pickFromAlbum: '앨범에서 선택',
      labelDialogTitle: '촬영 장소를 입력해주세요',
      labelDialogMessage: '입력하지 않아도 사진은 등록돼요',
      labelPlaceholder: '예: 홍대 카페',
      cameraUnavailable: '이 기기에서는 카메라를 쓸 수 없어요',
      permissionDenied: '사진 권한이 필요해요. 설정에서 허용해주세요',
      pickFailure: '사진을 가져오지 못했어요',
      uploadSuccess: '사진을 추가했어요',
      uploadFailure: '사진 업로드에 실패했어요. 다시 시도해주세요.',
      deleteDialogTitle: '사진을 삭제할까요?',
      deleteDialogMessage: '삭제한 사진은 되돌릴 수 없어요',
      deleteSuccess: '사진을 삭제했어요',
      deleteFailure: '사진 삭제에 실패했어요',
    },
    note: {
      deleteDialogTitle: '소감을 삭제할까요?',
      deleteDialogMessage: '삭제한 소감은 되돌릴 수 없어요',
      deleteSuccess: '소감을 삭제했어요',
      deleteFailure: '소감 삭제에 실패했어요',
    },
  },

  /** 소감 작성·수정 */
  bookNote: {
    /** 보이스 문서: "이미 좋습니다" — 그대로 유지 */
    placeholder: '이 책을 읽으며 든 생각을 자유롭게 남겨보세요',
    /** [담백] 한 권에도 여러 번 일어나는 고빈도 문구 — 선 1 */
    createSuccess: '소감을 저장했어요',
    updateSuccess: '소감을 수정했어요',
    saveFailure: '저장에 실패했어요. 다시 시도해주세요.',
  },

  /** 책 검색 · 등록 — Frame 08 계열 */
  bookSearch: {
    placeholder: '책 제목, 저자를 검색해보세요',
    /** [담백] 실패 상태 */
    emptyTitle: '검색 결과가 없어요',
    emptyDescription: '다른 검색어로 다시 시도해보세요',
  },
  bookRegister: {
    genreLabel: '장르 (필수)',
    submit: '서재에 등록하기',
    submitting: '등록하는 중…',
    /** [담백] 고빈도 문구 — 선 1에 따라 담백안 유지 */
    success: '서재에 등록했어요',
    failure: '등록에 실패했어요. 다시 시도해주세요.',
  },

  /** 리캡 대시보드 — Frame 05.1. 분기·연 단위로 보는 화면이라 맛이 가장 진한 자리 */
  dashboard: {
    /** §2 — 통계 라벨·화면 제목은 직역 고정 */
    completedBooks: '완독한 책',
    pagesRead: '읽은 페이지',
    genreRatio: '장르 비율',
    monthlyTrend: '월별 완독 추이',
    saveImage: '이미지 저장',
    goToShare: '공유 탭으로',
    periodMonth: '월간',
    periodQuarter: '분기',
    periodYear: '연간',
    monthLabel: '{month}월',
    /**
     * 하이라이트 문장 안에서 기간을 가리키는 말.
     * 토글 라벨(월간/분기/연간)을 그대로 넣으면 "이번 월간 입맛은"이 되어
     * 어색하므로 문장용 표현을 따로 둔다.
     */
    periodPhraseMonth: '이번 달',
    periodPhraseQuarter: '이번 분기',
    periodPhraseYear: '올해',
    /**
     * [맛] 리캡 하이라이트 — 보이스 문서 §4 리캡 표의 "맛있는 안" 그대로.
     * `{josa}`는 화면에서 `josa()`로 계산해 넘긴다.
     * 선 3에 따라 "많이 읽었다"를 칭찬하지 않고 취향·속도만 이야기한다.
     */
    highlightTopGenre: "{period} 입맛은 '{genre}'{josa}",
    highlightLongestRead: '『{title}』{josa} {days}일 동안 뜸 들여 읽으셨어요',
    highlightFastestRead: '『{title}』{josa} {days}일 만에 뚝딱',
    /** [맛] 한 장르만 읽은 경우 — 선 3에 따라 "편식"은 쓰지 않는다 */
    highlightSingleGenre: "{period}엔 '{genre}'에 푹 빠지셨네요",
    /** [맛] 완독 0권일 때의 대시보드 빈 상태 */
    emptyTitle: '아직 상이 비어 있어요',
    emptyDescription: '한 권만 다 읽어도 입맛이 보이기 시작해요',
  },

  /** 프로필 — Frame 05, Frame 05.2 */
  profile: {
    editButton: '프로필 편집',
    booksRead: '읽은 책',
    sharedRecords: '공유한 기록',
    recapCard: '이번 분기 리캡 보기',
    logout: '로그아웃',
    /** 통계 로딩 중 자리표시 */
    statPlaceholder: '–',
    edit: {
      changePhoto: '사진 변경',
      /** §2 — 필드 label 직역 고정. '관심 분야'를 '입맛'으로 바꾸지 않는다 */
      nicknameLabel: '닉네임 (필수)',
      nicknameHint: '{min}~{max}자, 한글/영문/숫자만',
      nicknamePlaceholder: '닉네임을 입력해주세요',
      nicknameTooShort: '닉네임은 {min}자 이상 입력해주세요',
      bioLabel: '한줄소개',
      bioPlaceholder: '나를 짧게 소개해보세요',
      genderLabel: '성별',
      interestsLabel: '관심 분야',
      /** [담백] 고빈도 저장 문구 — 선 1 */
      saveSuccess: '수정한 내역을 저장했어요',
      saveFailure: '저장하지 못했어요. 다시 시도해주세요.',
    },
    gender: {
      female: '여성',
      male: '남성',
      unspecified: '선택 안 함',
    },
  },

  /** 일정 — Frame 02, Frame 02.1 */
  schedule: {
    monthlyTitle: '이번달 독서 일정',
    /** [문서 미수록] 기존 문구 유지 */
    monthSummary: '{month} · 지금까지 {count}권 완독',
    continueReading: '이어서 읽기',
    registerNewBook: '새 책 등록하기',
    readingNowCount: '읽고 있는 책 · {count}',
    /** 보이스 문서 §4: 느낌표를 빼고 조사 유틸을 적용한 안 */
    currentReadingTitle: '오늘은 『{title}』{josa}\n마저 읽을 차례예요',
    currentReadingProgress: '어제 {page}p까지 읽었어요 · 진행률 {percent}%',
    /** [맛] 진행률 90% 이상일 때만 위 문구 대신 쓰는 조건부 문구 */
    currentReadingAlmostDone: '두 모금이면 끝나요 · {percent}%',
    meetingBanner: '이번주 독서모임 일정이 있어요!',
    /** [문서 미수록] 기존 문구 유지 */
    meetingSubtitle: '{dateLabel} · 독서모임 "{groupName}"',
    /**
     * [맛] 오랜만에 돌아온 사용자용 복귀 배너.
     * ⚠️ 아직 화면이 없다 — 배너를 만들 때 이 키를 연결할 것.
     * 선 3에 가장 가까운 문구라, 안 온 이유나 읽은 양은 언급하지 않는다.
     */
    returningBanner: '{days}일 만이네요. 오늘은 한 입만 어때요?',
    weekdays: {
      mon: '월',
      tue: '화',
      wed: '수',
      thu: '목',
      fri: '금',
      sat: '토',
      sun: '일',
    },
    detail: {
      addToCalendar: '캘린더에 추가',
      viewMeeting: '모임 상세보기',
    },
  },

  /** 공유 — Frame 04 계열 */
  share: {
    header: '공유',
    groupHistoryLink: '그룹 관리 · 공유 이력',
    /** [맛] 공유할 책을 아직 안 고른 빈 상태 */
    emptyTitle: '나눠 먹을 책을 골라주세요',
    emptyDescription: '서재에서 책을 고르면 공유 카드를 만들 수 있어요',
    emptyAction: '서재로 가기',
    targetBook: '공유할 기록: {title}',
    /** §2 — 필드 label·버튼은 직역 고정 */
    scopeLabel: '공유 범위',
    scopeAll: '전체 공개',
    scopeGroup: '그룹 선택',
    scopeCustom: '인원 직접 선택',
    scopeSummary: '{label} — {summary}',
    previewLabel: '공유 카드 미리보기',
    completedSuffix: '· {dateRange} 완독',
    /** [담백] 공개 범위 경고 — 선 2 */
    publicLinkNotice: '이 링크를 아는 사람은 누구나 볼 수 있어요',
    /** §2 — 버튼 라벨은 담백안 유지 */
    inAppShare: '콩닥책닥에서 공유',
    snsShare: 'SNS 공유',
    noNote: '소감 없음',
    /** [맛] 공유 성공 토스트. ⚠️ 아직 공유 실행 흐름이 없어 미사용 */
    shareSuccess: '잘 나눴어요!',
    /** [맛] 공유 카드 하단 워터마크. ⚠️ 카드 이미지 생성 구현 시 연결 */
    cardWatermark: '책거리 중 · 콩닥책닥',
  },

  /** 그룹 관리 · 공유 이력 */
  group: {
    myGroups: '내 그룹',
    createGroup: '새 그룹 만들기',
    shareHistory: '공유 이력',
  },

  /** 알림 — Frame 10 */
  notification: {
    /** 보이스 문서 §4 알림 표: 그룹 초대·공유 반응은 "유지" */
    memberJoinedTitle: '새 멤버가 참여했어요',
    memberJoinedMessage: '독서모임 "책벙개"에 새 멤버가 들어왔어요',
    reactionTitle: '공유한 기록에 반응이 있어요',
    reactionMessage: '『아몬드』 공유 카드에 좋아요가 달렸어요',
    scheduleTitle: '이번주 독서모임 일정 알림',
    scheduleMessage: '7월 20일(토) 14:00 · 독서모임 "책벙개"',
    /** [맛] 월 1회 알림이라 선 1에 걸리지 않는다. 제목·본문 모두 교체됨 */
    recapTitle: '7월 밥상이 차려졌어요',
    recapMessage: '이번 달 뭘 읽으셨는지 볼까요?',
  },

  /**
   * [맛 가장 진하게] 마일스톤 — 한 사용자에게 평생 한 번만 보이는 문구.
   * 보이스 문서 §5. 평소에 담백하게 쓴 덕분에 이 자리가 특별해진다.
   *
   * ⚠️ `firstBookRegistered`만 현재 연결되어 있다(서재가 비어 있을 때 첫 등록).
   * 나머지는 "몇 번째인지"를 서버가 알려줘야 한다 — 보이스 문서 §6대로
   * 완독 응답에 `completedCount` 같은 필드가 필요하며 백엔드 요청 항목이다.
   */
  milestone: {
    firstBookRegistered: '첫 책이 상에 올랐어요!',
    firstCompleted: '첫 책거리네요 🫘 콩송편 나눠 먹을 차례예요',
    firstShared: '처음으로 나눠 드셨어요!',
    tenthCompleted: '열 권째 책거리예요',
    yearlyRecap: '올해 차린 상, 한번 볼까요?',
  },

  /**
   * 공통 상태 UI — Frame 09(네트워크 에러), 준비 중 화면.
   * [담백] 이 블록 전체가 선 2(실패·경고) 적용 자리다. 은유를 넣지 않는다.
   */
  state: {
    networkError: '네트워크에 연결할 수 없어요',
    preparing: '{frame} · 준비 중',
  },

  /**
   * 데이터를 못 불러왔을 때 사용자에게 보여주는 문구.
   * [담백] 전부 선 2 적용 자리 — 실패 문구에 장난스러운 말투를 쓰지 않는다.
   */
  failure: {
    network: '네트워크 연결을 확인해주세요.',
    library: '서재를 불러오지 못했어요. 잠시 후 다시 시도해주세요.',
    profile: '프로필을 불러오지 못했어요.',
    dashboard: '대시보드를 불러오지 못했어요.',
    bookSearch: '도서 검색 중 오류가 발생했습니다.',
    photoUpload: '사진 업로드에 실패했어요. 잠시 후 다시 시도해주세요.',
    loginRequiredToAddBook: '로그인 후에 책을 등록할 수 있어요.',
  },

  /**
   * 개발자용 예외 메시지.
   * 사용자에게 노출되지 않지만, 문자열을 코드에서 떼어놓는 원칙은 동일하게 적용한다.
   */
  developer: {
    toastOutsideProvider:
      'useToast는 ToastProvider 안에서만 사용할 수 있습니다.',
    libraryOutsideProvider:
      'useLibrary는 LibraryProvider 안에서만 사용할 수 있습니다.',
    profileOutsideProvider:
      'useProfile은 ProfileProvider 안에서만 사용할 수 있습니다.',
    socialLoginFailed: '소셜 로그인 실패 ({provider})',
    authOutsideProvider: 'useAuth는 AuthProvider 안에서만 사용할 수 있습니다.',
  },
} as const;
