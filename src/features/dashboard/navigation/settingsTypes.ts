export type DriverVerificationPurpose = 'become' | 'complete';

export type SettingsStackParamList = {
  SettingsHome: undefined;
  SecuritySettings: undefined;
  DriverVerification: { purpose?: DriverVerificationPurpose } | undefined;
  NicVerification: { continueToDriverLicense?: boolean } | undefined;
  GeneralInformation: undefined;
  BankAccounts: undefined;
};
