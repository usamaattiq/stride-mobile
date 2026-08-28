import { apiRequest } from './client';

export type CreditPurchaseStatus = 'pending' | 'approved' | 'rejected';

export type CreditBankAccount = {
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban: string;
};

export type CreditCatalog = {
  unitPrice: number;
  currency: 'PKR';
  tripCreateCredits: number;
  bidOfferCredits: number;
  bankAccounts: CreditBankAccount[];
};

export type CreditPurchase = {
  id: string;
  credits: number;
  unitPrice: number;
  amount: number;
  proofUrl: string;
  proofViewUrl: string | null;
  status: CreditPurchaseStatus;
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

export const creditsApi = {
  getCatalog() {
    return apiRequest<CreditCatalog>({
      method: 'GET',
      url: '/credits/catalog',
      params: { _: Date.now() },
      headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
    });
  },

  getPurchase(purchaseId: string) {
    return apiRequest<CreditPurchase>({ method: 'GET', url: `/credits/purchases/${purchaseId}` });
  },

  listPurchases() {
    return apiRequest<{ items: CreditPurchase[] }>({ method: 'GET', url: '/credits/purchases' });
  },

  createPurchase(input: { credits: number; proofUrl?: string }) {
    return apiRequest<CreditPurchase>({
      method: 'POST',
      url: '/credits/purchases',
      data: input,
    });
  },
};
