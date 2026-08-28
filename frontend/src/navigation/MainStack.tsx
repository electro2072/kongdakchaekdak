import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import type {MainStackParamList} from './types';
import {MainTabs} from './MainTabs';
import {BookDetailScreen} from '../screens/BookDetailScreen';
import {BookSearchScreen} from '../screens/BookSearchScreen';
import {DashboardScreen} from '../screens/DashboardScreen';
import {ProfileEditScreen} from '../screens/ProfileEditScreen';
import {GroupManagementScreen} from '../screens/GroupManagementScreen';
import {ScheduleDetailScreen} from '../screens/ScheduleDetailScreen';
import {NotificationScreen} from '../screens/NotificationScreen';
import {MOCK_LIBRARY_BOOKS} from '../mocks/libraryBooks';
import {useTheme} from '../theme';

const Stack = createNativeStackNavigator<MainStackParamList>();

/** 하단 탭(Tabs) 위에 책 상세(Frame 03.1)/대시보드(Frame 05.1)/프로필 편집(Frame 05.2) 등을 push — 탭바 없이 전체화면으로 보여준다 */
export function MainStack() {
  const {colors} = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {backgroundColor: colors.surface},
        headerTintColor: colors.n900,
        headerShadowVisible: false,
      }}>
      <Stack.Screen
        name="Tabs"
        component={MainTabs}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="BookDetail"
        component={BookDetailScreen}
        options={({route}) => ({
          title:
            MOCK_LIBRARY_BOOKS.find(book => book.id === route.params.bookId)
              ?.title ?? '책 상세',
        })}
      />
      <Stack.Screen
        name="BookSearch"
        component={BookSearchScreen}
        options={{title: '책 검색', presentation: 'modal'}}
      />
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{title: '독서 대시보드'}}
      />
      <Stack.Screen
        name="ProfileEdit"
        component={ProfileEditScreen}
        options={{title: '프로필 편집'}}
      />
      <Stack.Screen
        name="GroupManagement"
        component={GroupManagementScreen}
        options={{title: '그룹 관리 · 공유 이력'}}
      />
      <Stack.Screen
        name="ScheduleDetail"
        component={ScheduleDetailScreen}
        options={{title: '일정 상세'}}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationScreen}
        options={{title: '알림'}}
      />
    </Stack.Navigator>
  );
}
