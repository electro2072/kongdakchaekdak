import React, {useState} from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {Plus, X, AlertCircle} from 'lucide-react-native';
import {useAuth} from '../navigation/AuthContext';
import {
  GENDER_OPTIONS,
  INTEREST_OPTIONS,
  MIN_NICKNAME_LENGTH,
  MAX_NICKNAME_LENGTH,
  sanitizeNickname,
  sanitizeNicknameWhileTyping,
  type GenderKey,
  type Genre,
} from '../constants/profileOptions';
import {GENRE_CHIP_COLORS} from '../constants/genreColors';
import {useTheme} from '../theme';
import {t} from '../strings';
import {ConfirmDialog} from '../components/ConfirmDialog';

/**
 * Frame 01.1 · 회원가입 (design/hifi_mockup_v1.html 기준)
 * 닉네임만 필수, 나머지(성별/관심분야/독서모임)는 전부 선택 입력.
 * 백엔드 회원가입 연동(Step 3 OAuth 완료 후)이 아직 없어서, 지금은 로컬 state만 관리하고
 * "시작하기"를 누르면 mock 로그인 처리되어 하단 탭으로 진입한다.
 *
 * 닉네임 필드는 Frame 01.2(폼 검증 에러) 패턴을 그대로 따른다 — 실제 중복 확인은
 * 백엔드 연동 전이라 아직 없고, 여기서는 최소 글자수만 클라이언트에서 검증한다.
 *
 * 성별/관심분야 옵션은 프로필 편집(Frame 05.2)과 정확히 같은 목록을 써야 해서
 * constants/profileOptions.ts 한 곳에만 정의하고 두 화면이 함께 가져다 쓴다.
 */
export function SignupScreen() {
  const {login, setPendingBookSearchOnEntry} = useAuth();
  const {colors, typography, radii, isDark} = useTheme();

  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState<GenderKey | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [groupQuery, setGroupQuery] = useState('');
  const [groups, setGroups] = useState<string[]>([]);
  // "가입을 환영해요!" 온보딩 다이얼로그(2026-09-07 신규, 사용자 제안) — "시작하기"를 누르면
  // login()을 바로 부르지 않고 이 다이얼로그를 먼저 띄운다. login()이 호출되는 순간
  // RootNavigator가 AuthStack(이 화면 포함)을 통째로 언마운트하고 MainStack으로 바꾸기 때문에,
  // 다이얼로그는 반드시 login() 호출 "전에" 이 화면 위에서 떠 있어야 한다.
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);

  // 2026-09-08 업데이트: 저장 시점에는 sanitizeNicknameWhileTyping이 아직 조합 중인 낱자를
  // 남겨뒀을 가능성까지 고려해 sanitizeNickname()으로 한 번 더 엄격히 정리한다
  // (프로필 편집(ProfileEditScreen)과 동일한 이유/패턴).
  const trimmedNickname = sanitizeNickname(nickname).trim();
  const nicknameError =
    nickname.length > 0 && trimmedNickname.length < MIN_NICKNAME_LENGTH
      ? t('auth.signup.nicknameTooShort', {min: MIN_NICKNAME_LENGTH})
      : null;
  const canSubmit = trimmedNickname.length >= MIN_NICKNAME_LENGTH;

  const toggleInterest = (item: string) => {
    setInterests(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item],
    );
  };

  const addGroup = () => {
    const trimmed = groupQuery.trim();
    if (!trimmed || groups.includes(trimmed)) {
      return;
    }
    setGroups(prev => [...prev, trimmed]);
    setGroupQuery('');
  };

  const removeGroup = (group: string) => {
    setGroups(prev => prev.filter(g => g !== group));
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.surface}]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={{marginBottom: 16}}>
          <Text style={[typography.h3, {color: colors.n900, marginBottom: 4}]}>
            {t('auth.signup.title')}
          </Text>
          <Text style={[typography.caption, {color: colors.n600}]}>
            {t('auth.signup.subtitle')}
          </Text>
        </View>

        <Field
          label={t('auth.signup.nicknameLabel')}
          hint={t('auth.signup.nicknameHint', {
            min: MIN_NICKNAME_LENGTH,
            max: MAX_NICKNAME_LENGTH,
          })}>
          <TextInput
            value={nickname}
            onChangeText={text =>
              setNickname(sanitizeNicknameWhileTyping(text))
            }
            maxLength={MAX_NICKNAME_LENGTH}
            placeholder={t('auth.signup.nicknamePlaceholder')}
            placeholderTextColor={colors.n400}
            autoCorrect={false}
            spellCheck={false}
            textBreakStrategy="simple"
            style={[
              styles.input,
              {
                backgroundColor: colors.n50,
                borderColor: nicknameError ? colors.error : colors.n300,
                color: colors.n900,
                borderRadius: radii.sm,
              },
            ]}
          />
          {nicknameError ? (
            <View style={styles.fieldErrorRow}>
              <AlertCircle size={12} color={colors.error} />
              <Text
                style={[
                  typography.caption,
                  {color: colors.error, fontSize: 11, marginLeft: 4},
                ]}>
                {nicknameError}
              </Text>
            </View>
          ) : null}
        </Field>

        <Field label={t('auth.signup.genderLabel')}>
          <View style={styles.row}>
            {GENDER_OPTIONS.map(option => {
              const selected = gender === option.key;
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.chip,
                    {
                      flex: 1,
                      borderRadius: radii.pill,
                      backgroundColor: selected
                        ? colors.accentSolidBg
                        : colors.n100,
                    },
                  ]}
                  onPress={() => setGender(option.key)}>
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: selected ? colors.onAccentSolid : colors.n700,
                        fontWeight: selected ? '600' : '400',
                      },
                    ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Field>

        <Field
          label={t('auth.signup.interestsLabel')}
          hint={t('common.multiSelect')}>
          <View style={[styles.row, styles.wrap]}>
            {INTEREST_OPTIONS.map(item => {
              const selected = interests.includes(item);
              // 6개 장르 고정색 전환(claude/독서기록앱_프론트요청_디자인_6개장르고정색전환_v1.md) —
              // 선택된 칩은 항상 그 장르 고유색, 미선택은 기존처럼 중립색
              const chipColor =
                GENRE_CHIP_COLORS[item as Genre][isDark ? 'dark' : 'light'];
              return (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.chip,
                    {
                      borderRadius: radii.pill,
                      backgroundColor: selected ? chipColor.bg : colors.n100,
                    },
                  ]}
                  onPress={() => toggleInterest(item)}>
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: selected ? chipColor.text : colors.n700,
                        fontWeight: selected ? '600' : '400',
                      },
                    ]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Field>

        <Field label={t('auth.signup.groupLabel')} hint={t('common.optional')}>
          <View
            style={[
              styles.groupSearch,
              {borderRadius: radii.pill, borderColor: colors.n300},
            ]}>
            <TextInput
              value={groupQuery}
              onChangeText={setGroupQuery}
              placeholder={t('auth.signup.groupPlaceholder')}
              placeholderTextColor={colors.n400}
              autoCorrect={false}
              spellCheck={false}
              textBreakStrategy="simple"
              style={[typography.caption, {flex: 1, color: colors.n900}]}
              onSubmitEditing={addGroup}
            />
            <TouchableOpacity onPress={addGroup}>
              <View style={styles.addGroupBtn}>
                <Plus size={14} color={colors.p700} />
                <Text
                  style={[
                    typography.caption,
                    {color: colors.p700, fontWeight: '700', marginLeft: 2},
                  ]}>
                  {t('common.add')}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          {groups.length > 0 && (
            <View style={[styles.row, styles.wrap, {marginTop: 7}]}>
              {groups.map(group => (
                <View
                  key={group}
                  style={[
                    styles.chip,
                    styles.groupChip,
                    {borderRadius: radii.pill, borderColor: colors.p700},
                  ]}>
                  <Text
                    style={[
                      typography.caption,
                      {color: colors.p700, fontWeight: '600'},
                    ]}>
                    {group}
                  </Text>
                  <TouchableOpacity
                    onPress={() => removeGroup(group)}
                    style={{marginLeft: 6}}>
                    <X size={12} color={colors.p700} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </Field>
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.primaryButton,
          {backgroundColor: colors.accentSolidBg, borderRadius: radii.pill},
          !canSubmit && {opacity: 0.5},
        ]}
        onPress={() => setShowWelcomeDialog(true)}
        disabled={!canSubmit}>
        <Text style={[typography.button, {color: colors.onAccentSolid}]}>
          {t('auth.signup.submit')}
        </Text>
      </TouchableOpacity>

      <ConfirmDialog
        visible={showWelcomeDialog}
        title={t('auth.signup.welcomeDialogTitle')}
        message={t('auth.signup.welcomeDialogMessage')}
        cancelLabel={t('common.later')}
        confirmLabel={t('auth.signup.welcomeDialogConfirm')}
        onCancel={() => {
          setShowWelcomeDialog(false);
          login();
        }}
        onConfirm={() => {
          setShowWelcomeDialog(false);
          setPendingBookSearchOnEntry(true);
          login();
        }}
      />
    </SafeAreaView>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  const {colors, typography} = useTheme();
  return (
    <View style={{marginBottom: 14}}>
      <Text
        style={[typography.overline, {color: colors.n600, marginBottom: 6}]}>
        {label}
        {hint ? <Text style={{color: colors.n400}}> · {hint}</Text> : null}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  wrap: {
    flexWrap: 'wrap',
  },
  input: {
    height: 36,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  fieldErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  chip: {
    height: 28,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupSearch: {
    height: 36,
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingLeft: 12,
    paddingRight: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addGroupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  groupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  primaryButton: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
});
