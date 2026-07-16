export type RequestKind = 'auction' | 'rfq';

export type RequestCategory = 'all' | 'rfq' | 'auction' | 'fullVehicle' | 'shared';

export type ReverseRequest = {
  id: string;
  kinds: RequestKind[];
  category: Exclude<RequestCategory, 'all'>;
  postedAgo: string;
  fromCity: string;
  toCity: string;
  fromArea: string;
  toArea: string;
  dateRange: string;
  timeLabel: string;
  vehicle: string;
  seats: string;
  bags: string;
  priceLabelKey: 'startingPrice' | 'budget';
  price: string;
  statusBadge: {
    tone: 'danger' | 'purple' | 'muted';
    label: string;
  };
  footerLabel: string;
  ctaKey: 'viewDetails' | 'placeOffer';
  bookmarked?: boolean;
};

export type HomeFeedItem =
  | { type: 'request'; data: ReverseRequest }
  | { type: 'ad'; id: string };
