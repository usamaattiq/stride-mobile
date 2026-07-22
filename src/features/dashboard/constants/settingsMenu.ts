import type { ComponentProps } from 'react';
import type { FontAwesome } from '@expo/vector-icons';

import type { AppRole } from '../context/DashboardSessionContext';

export type SettingsMenuAction =
  | 'language'
  | 'terms'
  | 'privacy'
  | 'security'
  | 'general-info'
  | 'become-driver'
  | 'manage-vehicles'
  | 'switch-passenger';

export type SettingsMenuItem = {
  id: string;
  titleKey: string;
  subtitleKey: string;
  icon: ComponentProps<typeof FontAwesome>['name'];
  action: SettingsMenuAction;
  /** Show only for these roles. Omit = all roles. */
  roles?: AppRole[];
};

export type SettingsMenuSection = {
  id: string;
  titleKey: string;
  items: SettingsMenuItem[];
};

export const settingsMenuIconStyle = {
  iconBackgroundColor: '#FEE4E2',
  iconColor: '#B42318',
} as const;

export const SETTINGS_MENU_SECTIONS: SettingsMenuSection[] = [
  {
    id: 'account',
    titleKey: 'profile.sections.account',
    items: [
      {
        id: 'general-info',
        titleKey: 'profile.account.generalInfo.title',
        subtitleKey: 'profile.account.generalInfo.subtitle',
        icon: 'id-card-o',
        action: 'general-info',
      },
      {
        id: 'become-driver',
        titleKey: 'profile.account.becomeDriver.title',
        subtitleKey: 'profile.account.becomeDriver.subtitle',
        icon: 'car',
        action: 'become-driver',
        roles: ['passenger'],
      },
      {
        id: 'manage-vehicles',
        titleKey: 'profile.account.manageVehicles.title',
        subtitleKey: 'profile.account.manageVehicles.subtitle',
        icon: 'car',
        action: 'manage-vehicles',
        roles: ['driver'],
      },
      {
        id: 'switch-passenger',
        titleKey: 'profile.account.switchPassenger.title',
        subtitleKey: 'profile.account.switchPassenger.subtitle',
        icon: 'user',
        action: 'switch-passenger',
        roles: ['driver'],
      },
      {
        id: 'security',
        titleKey: 'profile.account.security.title',
        subtitleKey: 'profile.account.security.subtitle',
        icon: 'lock',
        action: 'security',
      },
    ],
  },
  {
    id: 'preferences',
    titleKey: 'profile.sections.preferences',
    items: [
      {
        id: 'language',
        titleKey: 'profile.settings.language.title',
        subtitleKey: 'profile.settings.language.subtitle',
        icon: 'globe',
        action: 'language',
      },
    ],
  },
  {
    id: 'support',
    titleKey: 'profile.sections.support',
    items: [
      {
        id: 'terms',
        titleKey: 'profile.support.terms.title',
        subtitleKey: 'profile.support.terms.subtitle',
        icon: 'file-text-o',
        action: 'terms',
      },
      {
        id: 'privacy',
        titleKey: 'profile.support.privacy.title',
        subtitleKey: 'profile.support.privacy.subtitle',
        icon: 'shield',
        action: 'privacy',
      },
    ],
  },
];

export function getSettingsSectionsForRole(role: AppRole): SettingsMenuSection[] {
  return SETTINGS_MENU_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.roles || item.roles.includes(role)),
  })).filter((section) => section.items.length > 0);
}
