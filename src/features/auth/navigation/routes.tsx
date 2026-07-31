import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useLoginFlowStore } from '@/store/loginFlowStore';
import { useSignupDraftStore } from '@/store/signupDraftStore';
import { SignupSuccessScreen } from '../screens/SignupSuccessScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import type { AuthStackParamList } from './types';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

export function WelcomeRoute(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const { resetDraft } = useSignupDraftStore();

  return (
    <WelcomeScreen
      onSignUp={() => {
        resetDraft();
        navigation.navigate('SignupFlow');
      }}
      onLogIn={() => {
        resetDraft();
        useLoginFlowStore.getState().reset();
        navigation.navigate('LoginFlow');
      }}
      onDashboard={() => {
        navigation.navigate('Dashboard');
      }}
    />
  );
}

export function SignupSuccessRoute(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const { resetDraft } = useSignupDraftStore();

  const goDashboard = () => {
    resetDraft();
    navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
  };

  return <SignupSuccessScreen onGoToDashboard={goDashboard} />;
}
