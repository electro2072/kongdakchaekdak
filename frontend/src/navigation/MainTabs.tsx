import React, {useEffect} from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {CalendarDays, Library, Share2, User} from 'lucide-react-native';
import type {MainStackParamList, MainTabParamList} from './types';
import {ScheduleScreen} from '../screens/ScheduleScreen';
import {LibraryScreen} from '../screens/LibraryScreen';
import {ShareScreen} from '../screens/ShareScreen';
import {ProfileScreen} from '../screens/ProfileScreen';
import {useAuth} from './AuthContext';
import {useTheme} from '../theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICON: Record<keyof MainTabParamList, typeof CalendarDays> = {
  Schedule: CalendarDays,
  Library: Library,
  Share: Share2,
  Profile: User,
};

/** 로그인 후 하단 탭: 일정 / 서재 / 공유 / 프로필 (기획서 3장 IA 기준, 아이콘: Lucide) */
export function MainTabs() {
  const {colors} = useTheme();
  const {pendingBookSearchOnEntry, setPendingBookSearchOnEntry} = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  // 신규 가입 온보딩 다이얼로그(SignupScreen)에서 "네"를 선택했으면, 로그인 직후 처음 뜨는
  // 이 탭 화면 위로 BookSearch 모달을 자동으로 한 번 push한다 — Tabs가 스택에 그대로 남아있는
  // 채로 push하는 방식이라, BookSearch에서 뒤로가기/취소를 누르면 평소와 똑같이 이 탭으로
  // 돌아온다(특별 케이스 처리 불필요). 1회성 신호라 읽자마자 바로 꺼서 재로그인 시 재발동을 막는다.
  useEffect(() => {
    if (pendingBookSearchOnEntry) {
      setPendingBookSearchOnEntry(false);
      navigation.navigate('BookSearch');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color}) => {
          const Icon = TAB_ICON[route.name];
          return (
            <Icon size={22} color={color} strokeWidth={focused ? 2.4 : 2} />
          );
        },
        tabBarActiveTintColor: colors.p700,
        tabBarInactiveTintColor: colors.n500,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.hairline,
        },
      })}>
      <Tab.Screen
        name="Schedule"
        component={ScheduleScreen}
        options={{title: '일정'}}
      />
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{title: '서재'}}
      />
      <Tab.Screen
        name="Share"
        component={ShareScreen}
        options={{title: '공유'}}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{title: '프로필'}}
      />
    </Tab.Navigator>
  );
}
