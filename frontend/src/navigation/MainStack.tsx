import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import type {MainStackParamList} from './types';
import {MainTabs} from './MainTabs';
import {BookDetailScreen} from '../screens/BookDetailScreen';
import {MOCK_LIBRARY_BOOKS} from '../mocks/libraryBooks';
import {useTheme} from '../theme';

const Stack = createNativeStackNavigator<MainStackParamList>();

/** 하단 탭(Tabs) 위에 책 상세(Frame 03.1)를 push — 상세 화면은 탭바 없이 전체화면으로 보여준다 */
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
    </Stack.Navigator>
  );
}
