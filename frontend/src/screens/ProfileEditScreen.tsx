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
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {User, AlertCircle} from 'lucide-react-native';
import type {MainStackParamList} from '../navigation/types';
import {useProfile} from '../navigation/ProfileContext';
import {
  GENDER_OPTIONS,
  INTEREST_OPTIONS,
  MIN_NICKNAME_LENGTH,
  type GenderKey,
} from '../constants/profileOptions';
import {useTheme} from '../theme';

/**
 * Frame 05.2 · 프로필 편집 — claude/독서기록앱_디자인시스템_Hifi목업_v1.md(v1.3.2) 기준:
 * 원형 아바타 placeholder + "사진 변경", 닉네임, 한줄소개(선택), 성별 칩(단일선택),
 * 관심분야 칩(중복선택), "저장하기" 버튼.
 *
 * PATCH /api/users/{id}는 있지만 관심분야(interests)를 채우는 DTO 연동은 백엔드가 아직
 * 안 붙여놔서(개발현황.md 28번 항목) 이번에도 mock-first로 간다 — 저장하면 ProfileContext의
 * 로컬 state만 갱신하고 화면을 뒤로 돌아간다. 사진 변경은 이미지 피커 라이브러리 선정이
 * 필요한 별도 작업이라 이번 범위에서 제외(버튼만 배치, onPress 없음).
 *
 * 주요 인터랙션 요소에 testID를 달아뒀다 — 이 저장소 테스트가 @testing-library/react-native 없이
 * react-test-renderer만 쓰기 때문에(__tests__/bookService.test.ts, App.test.tsx 참고), 옵션 목록
 * 순서에 의존하지 않고 안정적으로 요소를 찾을 수 있게 하기 위함(__tests__/ProfileEditScreen.test.tsx).
 */
export function ProfileEditScreen() {
  const {colors, typography, radii} = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const {profile, updateProfile} = useProfile();

  const [nickname, setNickname] = useState(profile.nickname);
  const [bio, setBio] = useState(profile.bio);
  const [gender, setGender] = useState<GenderKey | null>(profile.gender);
  const [interests, setInterests] = useState<string[]>(profile.interests);

  const trimmedNickname = nickname.trim();
  const nicknameError =
    nickname.length > 0 && trimmedNickname.length < MIN_NICKNAME_LENGTH
      ? `닉네임은 ${MIN_NICKNAME_LENGTH}자 이상 입력해주세요`
      : null;
  const canSubmit = trimmedNickname.length >= MIN_NICKNAME_LENGTH;

  const toggleInterest = (item: string) => {
    setInterests(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item],
    );
  };

  const handleSave = () => {
    if (!canSubmit) {
      return;
    }
    updateProfile({
      nickname: trimmedNickname,
      bio: bio.trim(),
      gender,
      interests,
    });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.surface}]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.avatarBlock}>
          <View style={[styles.avatar, {backgroundColor: colors.p50}]}>
            <User size={28} color={colors.p400} />
          </View>
          {/* TODO: 이미지 피커 라이브러리(react-native-image-picker 등) 선정 후 연결 — 이번 범위 제외 */}
          <TouchableOpacity>
            <Text style={[typography.caption, {color: colors.p700, fontWeight: '600'}]}>
              사진 변경
            </Text>
          </TouchableOpacity>
        </View>

        <Field label="닉네임 (필수)">
          <TextInput
            testID="nickname-input"
            value={nickname}
            onChangeText={setNickname}
            placeholder="닉네임을 입력해주세요"
            placeholderTextColor={colors.n400}
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

        <Field label="한줄소개" hint="선택">
          <TextInput
            testID="bio-input"
            value={bio}
            onChangeText={setBio}
            placeholder="나를 짧게 소개해보세요"
            placeholderTextColor={colors.n400}
            style={[
              styles.input,
              {
                backgroundColor: colors.n50,
                borderColor: colors.n300,
                color: colors.n900,
                borderRadius: radii.sm,
              },
            ]}
          />
        </Field>

        <Field label="성별">
          <View style={styles.row}>
            {GENDER_OPTIONS.map(option => {
              const selected = gender === option.key;
              return (
                <TouchableOpacity
                  key={option.key}
                  testID={`gender-chip-${option.key}`}
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

        <Field label="관심 분야" hint="중복선택">
          <View style={[styles.row, styles.wrap]}>
            {INTEREST_OPTIONS.map(item => {
              const selected = interests.includes(item);
              return (
                <TouchableOpacity
                  key={item}
                  testID={`interest-chip-${item}`}
                  style={[
                    styles.chip,
                    {
                      borderRadius: radii.pill,
                      backgroundColor: selected
                        ? colors.accentSolidBg
                        : colors.n100,
                    },
                  ]}
                  onPress={() => toggleInterest(item)}>
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: selected ? colors.onAccentSolid : colors.n700,
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
      </ScrollView>

      <TouchableOpacity
        testID="save-button"
        style={[
          styles.primaryButton,
          {backgroundColor: colors.accentSolidBg, borderRadius: radii.pill},
          !canSubmit && {opacity: 0.5},
        ]}
        onPress={handleSave}
        disabled={!canSubmit}>
        <Text style={[typography.button, {color: colors.onAccentSolid}]}>
          저장하기
        </Text>
      </TouchableOpacity>
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
    paddingTop: 16,
    paddingBottom: 12,
  },
  avatarBlock: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
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
  primaryButton: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
});
