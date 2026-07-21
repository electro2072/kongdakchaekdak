import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {CalendarDays, Library, Share2, User} from 'lucide-react-native';
import type {MainTabParamList} from './types';
import {ScheduleScreen} from '../screens/ScheduleScreen';
import {LibraryScreen} from '../screens/LibraryScreen';
import {ShareScreen} from '../screens/ShareScreen';
import {ProfileScreen} from '../screens/ProfileScreen';
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
