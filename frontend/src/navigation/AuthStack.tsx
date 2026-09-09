import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import type {AuthStackParamList} from './types';
import {LoginScreen} from '../screens/LoginScreen';
import {SignupScreen} from '../screens/SignupScreen';
import {useTheme} from '../theme';
import {t} from '../strings';

const Stack = createNativeStackNavigator<AuthStackParamList>();

/** 로그인 전 스택: Frame 01 로그인 → Frame 01.1 회원가입 */
export function AuthStack() {
  const {colors} = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: {backgroundColor: colors.surface},
        headerTintColor: colors.n900,
        headerShadowVisible: false,
      }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen
        name="Signup"
        component={SignupScreen}
        options={{headerShown: true, title: t('nav.signup')}}
      />
    </Stack.Navigator>
  );
}
