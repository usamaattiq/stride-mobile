import { apiRequest } from './client';
import type {
  AuctionBidSummary,
  AuctionOwnerSnapshot,
  AuctionSnapshot,
  PlaceBidPayload,
} from './auctionApi.types';

export const auctionApi = {
  getSnapshot: (tripId: string): Promise<AuctionSnapshot> =>
    apiRequest({ method: 'GET', url: `/trips/${tripId}/auction` }),

  listBids: (tripId: string): Promise<{ bids: AuctionBidSummary[] }> =>
    apiRequest({ method: 'GET', url: `/trips/${tripId}/auction/bids` }),

  placeBid: (tripId: string, payload: PlaceBidPayload): Promise<AuctionSnapshot> =>
    apiRequest({ method: 'POST', url: `/trips/${tripId}/auction/bids`, data: payload }),

  withdraw: (tripId: string): Promise<AuctionSnapshot> =>
    apiRequest({ method: 'POST', url: `/trips/${tripId}/auction/withdraw` }),

  confirm: (tripId: string): Promise<AuctionSnapshot> =>
    apiRequest({ method: 'POST', url: `/trips/${tripId}/auction/confirm` }),

  decline: (tripId: string): Promise<AuctionSnapshot> =>
    apiRequest({ method: 'POST', url: `/trips/${tripId}/auction/decline` }),

  selectNext: (tripId: string): Promise<AuctionOwnerSnapshot> =>
    apiRequest({ method: 'POST', url: `/trips/${tripId}/auction/owner/select-next` }),

  close: (tripId: string): Promise<AuctionOwnerSnapshot> =>
    apiRequest({ method: 'POST', url: `/trips/${tripId}/auction/owner/close` }),

  cancel: (tripId: string): Promise<AuctionOwnerSnapshot> =>
    apiRequest({ method: 'POST', url: `/trips/${tripId}/auction/owner/cancel` }),

  activate: (tripId: string): Promise<AuctionOwnerSnapshot> =>
    apiRequest({ method: 'POST', url: `/trips/${tripId}/auction/owner/activate` }),
};
