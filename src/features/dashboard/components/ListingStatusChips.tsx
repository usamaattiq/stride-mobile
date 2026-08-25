import React from 'react';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { FilterChips } from '@/shared/components/FilterChips';

import type { ListingStatusFilter } from '../utils/listingFilters';

type ListingStatusChipsProps = {
  active: ListingStatusFilter;
  onChange: (status: ListingStatusFilter) => void;
};

const OPTIONS: { id: ListingStatusFilter; labelKey: string }[] = [
  { id: 'all', labelKey: 'dashboard.listings.statusFilter.all' },
  { id: 'live', labelKey: 'dashboard.listings.statusFilter.live' },
  { id: 'past', labelKey: 'dashboard.listings.statusFilter.past' },
  { id: 'completed', labelKey: 'dashboard.listings.statusFilter.completed' },
];

export function ListingStatusChips({
  active,
  onChange,
}: ListingStatusChipsProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });

  return (
    <FilterChips
      active={active}
      onChange={onChange}
      options={OPTIONS.map((option) => ({
        id: option.id,
        label: t(option.labelKey),
      }))}
    />
  );
}
