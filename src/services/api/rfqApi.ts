import { apiRequest } from './client';
import type { RfqOfferResponse, RfqOwnerSnapshot, RfqSnapshot, SubmitOfferPayload } from './rfqApi.types';

export const rfqApi = {
  getSnapshot: (tripId: string): Promise<RfqSnapshot> =>
    apiRequest({ method: 'GET', url: `/trips/${tripId}/rfq` }),

  submitOffer: (tripId: string, payload: SubmitOfferPayload): Promise<RfqOfferResponse> =>
    apiRequest({ method: 'POST', url: `/trips/${tripId}/rfq/offers`, data: payload }),

  selectOffer: (tripId: string, offerId: string): Promise<RfqOwnerSnapshot> =>
    apiRequest({ method: 'POST', url: `/trips/${tripId}/rfq/offers/${offerId}/select` }),

  /** Owner shortcut: select + auto-confirm for the responder. */
  acceptOffer: (tripId: string, offerId: string): Promise<RfqSnapshot> =>
    apiRequest({ method: 'POST', url: `/trips/${tripId}/rfq/offers/${offerId}/accept` }),

  rejectOffer: (tripId: string, offerId: string): Promise<RfqSnapshot> =>
    apiRequest({ method: 'POST', url: `/trips/${tripId}/rfq/offers/${offerId}/reject` }),

  withdrawOffer: (tripId: string, offerId: string): Promise<RfqSnapshot> =>
    apiRequest({ method: 'POST', url: `/trips/${tripId}/rfq/offers/${offerId}/withdraw` }),

  confirmOffer: (tripId: string, offerId: string): Promise<RfqSnapshot> =>
    apiRequest({ method: 'POST', url: `/trips/${tripId}/rfq/offers/${offerId}/confirm` }),

  declineOffer: (tripId: string, offerId: string): Promise<RfqSnapshot> =>
    apiRequest({ method: 'POST', url: `/trips/${tripId}/rfq/offers/${offerId}/decline` }),

  closeRfq: (tripId: string): Promise<RfqOwnerSnapshot> =>
    apiRequest({ method: 'POST', url: `/trips/${tripId}/rfq/close` }),

  completeRfq: (tripId: string): Promise<RfqOwnerSnapshot> =>
    apiRequest({ method: 'POST', url: `/trips/${tripId}/rfq/complete` }),
};
