import React from 'react';
import {Text} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useRoute, type RouteProp} from '@react-navigation/native';
import type {MainStackParamList} from './types';
import {MainTabs} from './MainTabs';
import {BookDetailScreen} from '../screens/BookDetailScreen';
import {BookSearchScreen} from '../screens/BookSearchScreen';
import {BookRegisterConfirmScreen} from '../screens/BookRegisterConfirmScreen';
import {BookNoteEditScreen} from '../screens/BookNoteEditScreen';
import {DashboardScreen} from '../screens/DashboardScreen';
import {ProfileEditScreen} from '../screens/ProfileEditScreen';
import {GroupManagementScreen} from '../screens/GroupManagementScreen';
import {ScheduleDetailScreen} from '../screens/ScheduleDetailScreen';
import {NotificationScreen} from '../screens/NotificationScreen';
import {useLibrary} from './LibraryContext';
import {useTheme} from '../theme';

const Stack = createNativeStackNavigator<MainStackParamList>();

/**
 * BookDetail 헤더 타이틀 — LibraryContext(서재 mock state)에서 실시간으로 책 제목을 찾는다.
 * Frame 08.2(책 등록 확인)에서 방금 등록한 책도 바로 여기서 찾아져야 해서, 정적 MOCK_LIBRARY_BOOKS
 * 대신 useLibrary()를 쓴다 — options는 컴포넌트가 아니라서 훅을 못 쓰므로 headerTitle을
 * 별도 컴포넌트로 분리했다.
 */
function BookDetailHeaderTitle() {
  const route = useRoute<RouteProp<MainStackParamList, 'BookDetail'>>();
  const {books} = useLibrary();
  const {colors, typography} = useTheme();
  const title =
    books.find(book => book.id === route.params.bookId)?.title ?? '책 상세';
  return (
    <Text style={[typography.bodyStrong, {color: colors.n900, fontSize: 15}]}>
      {title}
    </Text>
  );
}

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
        options={{headerTitle: () => <BookDetailHeaderTitle />}}
      />
      <Stack.Screen
        name="BookSearch"
        component={BookSearchScreen}
        options={{title: '책 검색', presentation: 'modal'}}
      />
      <Stack.Screen
        name="BookRegisterConfirm"
        component={BookRegisterConfirmScreen}
        options={{title: '책 등록 확인', presentation: 'modal'}}
      />
      <Stack.Screen
        name="BookNoteEdit"
        component={BookNoteEditScreen}
        options={({route}) => ({
          title: route.params.noteId ? '소감 수정' : '소감 작성',
        })}
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
      {/*
        아래 3개는 화면 파일과 types.ts 라우트 타입은 있었는데 라우터 등록만 빠져 있어서,
        tsc는 통과하는데 실제로 누르면 크래시했다(릴리스 게이트 G4 / FINDING-20260828-10).
        일정·알림의 v1 포함 여부는 아직 미결이라 여기서는 "눌러도 안 죽는" 등록까지만 하고,
        실데이터 연동이나 진입점 숨김은 범위 결정 후 별도 슬라이스에서 처리한다.
      */}
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
