import { apiRequest } from './client';
import type { RfqOfferResponse, RfqSnapshot, SubmitOfferPayload } from './rfqApi.types';

export const rfqApi = {
  getSnapshot: (tripId: string): Promise<RfqSnapshot> =>
    apiRequest({ method: 'GET', url: `/trips/${tripId}/rfq` }),

  submitOffer: (tripId: string, payload: SubmitOfferPayload): Promise<RfqOfferResponse> =>
    apiRequest({ method: 'POST', url: `/trips/${tripId}/rfq/offers`, data: payload }),

  acceptOffer: (tripId: string, offerId: string): Promise<RfqSnapshot> =>
    apiRequest({ method: 'POST', url: `/trips/${tripId}/rfq/offers/${offerId}/accept` }),

  rejectOffer: (tripId: string, offerId: string): Promise<RfqSnapshot> =>
    apiRequest({ method: 'POST', url: `/trips/${tripId}/rfq/offers/${offerId}/reject` }),

  withdrawOffer: (tripId: string, offerId: string): Promise<RfqSnapshot> =>
    apiRequest({ method: 'POST', url: `/trips/${tripId}/rfq/offers/${offerId}/withdraw` }),
};
