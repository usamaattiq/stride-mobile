export type HomeStackParamList = {
  HomeMain: { panel?: 'feed' | 'messages' | 'notifications' } | undefined;
  BuyCredits: undefined;
  BuyCreditRequestDetail: { purchaseId: string };
};
