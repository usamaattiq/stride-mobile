import { apiRequest } from './client';

export type CreditPurchaseStatus = 'pending' | 'approved' | 'rejected';

export type CreditCatalog = {
  unitPrice: number;
  currency: 'PKR';
  tripCreateCredits: number;
  bidOfferCredits: number;
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
    return apiRequest<CreditCatalog>({ method: 'GET', url: '/credits/catalog' });
  },

  getPurchase(purchaseId: string) {
    return apiRequest<CreditPurchase>({ method: 'GET', url: `/credits/purchases/${purchaseId}` });
  },

  listPurchases() {
    return apiRequest<{ items: CreditPurchase[] }>({ method: 'GET', url: '/credits/purchases' });
  },

  createPurchase(input: { credits: number; proofUrl: string }) {
    return apiRequest<CreditPurchase>({
      method: 'POST',
      url: '/credits/purchases',
      data: input,
    });
  },
};
