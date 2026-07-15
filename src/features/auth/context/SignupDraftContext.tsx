import React, { createContext, useContext, useMemo, useState } from 'react';

import {
  createEmptySignupDraft,
  type SignupDraft,
} from '../types/signup.types';

type SignupDraftContextValue = {
  draft: SignupDraft;
  patchDraft: (partial: Partial<SignupDraft>) => void;
  resetDraft: () => void;
  loginMpin: string;
  setLoginMpin: (value: string) => void;
};

const SignupDraftContext = createContext<SignupDraftContextValue | null>(null);

export function SignupDraftProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [draft, setDraft] = useState<SignupDraft>(createEmptySignupDraft);
  const [loginMpin, setLoginMpin] = useState('');

  const value = useMemo<SignupDraftContextValue>(
    () => ({
      draft,
      patchDraft: (partial) => {
        setDraft((current) => ({ ...current, ...partial }));
      },
      resetDraft: () => {
        setDraft(createEmptySignupDraft());
        setLoginMpin('');
      },
      loginMpin,
      setLoginMpin,
    }),
    [draft, loginMpin],
  );

  return (
    <SignupDraftContext.Provider value={value}>{children}</SignupDraftContext.Provider>
  );
}

export function useSignupDraft(): SignupDraftContextValue {
  const context = useContext(SignupDraftContext);
  if (!context) {
    throw new Error('useSignupDraft must be used within SignupDraftProvider');
  }
  return context;
}
