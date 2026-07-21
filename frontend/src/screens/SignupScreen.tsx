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
import {Plus, X} from 'lucide-react-native';
import {useAuth} from '../navigation/AuthContext';
import {useTheme} from '../theme';

const GENDER_OPTIONS = [
  {key: 'female', label: '여성'},
  {key: 'male', label: '남성'},
  {key: 'unspecified', label: '선택 안 함'},
] as const;

const INTEREST_OPTIONS = [
  '소설',
  '에세이',
  '자기계발',
  '인문',
  '과학',
  '경제·경영',
];

/**
 * Frame 01.1 · 회원가입 (design/hifi_mockup_v1.html 기준)
 * 닉네임만 필수, 나머지(성별/관심분야/독서모임)는 전부 선택 입력.
 * 백엔드 회원가입 연동(Step 3 OAuth 완료 후)이 아직 없어서, 지금은 로컬 state만 관리하고
 * "시작하기"를 누르면 mock 로그인 처리되어 하단 탭으로 진입한다.
 */
export function SignupScreen() {
  const {login} = useAuth();
  const {colors, typography, radii} = useTheme();

  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState<
    (typeof GENDER_OPTIONS)[number]['key'] | null
  >(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [groupQuery, setGroupQuery] = useState('');
  const [groups, setGroups] = useState<string[]>([]);

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
            몇 가지만 알려주세요
          </Text>
          <Text style={[typography.caption, {color: colors.n600}]}>
            닉네임 외 모든 정보는 선택이에요
          </Text>
        </View>

        <Field label="닉네임 (필수)">
          <TextInput
            value={nickname}
            onChangeText={setNickname}
            placeholder="닉네임을 입력해주세요"
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

        <Field label="속한 독서모임이 있나요?" hint="선택">
          <View
            style={[
              styles.groupSearch,
              {borderRadius: radii.pill, borderColor: colors.n300},
            ]}>
            <TextInput
              value={groupQuery}
              onChangeText={setGroupQuery}
              placeholder="모임 이름으로 검색"
              placeholderTextColor={colors.n400}
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
                  추가
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
          !nickname.trim() && {opacity: 0.5},
        ]}
        onPress={login}
        disabled={!nickname.trim()}>
        <Text style={[typography.button, {color: colors.onAccentSolid}]}>
          시작하기
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
