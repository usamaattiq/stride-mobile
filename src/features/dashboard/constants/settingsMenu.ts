import type { ComponentProps } from 'react';
import type { FontAwesome } from '@expo/vector-icons';

import type { AppRole } from '../context/DashboardSessionContext';

export type SettingsMenuAction =
  | 'language'
  | 'terms'
  | 'privacy'
  | 'security'
  | 'general-info'
  | 'manage-vehicles'
  | 'become-driver'
  | 'switch-driver'
  | 'switch-passenger'
  | 'delete-account';

export type SettingsMenuItem = {
  id: string;
  titleKey: string;
  subtitleKey: string;
  icon: ComponentProps<typeof FontAwesome>['name'];
  action: SettingsMenuAction;
  /**
   * Visibility rule:
   * - Omit = always shown
   * - `roles` only = shown for those roles
   * - `requiresDriverVerification` = passenger who already completed license verification
   * - `requiresNoDriverVerification` = passenger who has never verified as driver
   */
  roles?: AppRole[];
  requiresDriverVerification?: boolean;
  requiresNoDriverVerification?: boolean;
};

export type SettingsMenuSection = {
  id: string;
  titleKey: string;
  items: SettingsMenuItem[];
};

export type SettingsMenuVisibility = {
  role: AppRole;
  hasDriverVerification: boolean;
  /** Admin sessions only show language / legal items on the shared Settings screen. */
  isAdmin?: boolean;
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
        requiresNoDriverVerification: true,
      },
      {
        id: 'switch-driver',
        titleKey: 'profile.account.switchDriver.title',
        subtitleKey: 'profile.account.switchDriver.subtitle',
        icon: 'car',
        action: 'switch-driver',
        roles: ['passenger'],
        requiresDriverVerification: true,
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
        id: 'manage-vehicles',
        titleKey: 'profile.account.manageVehicles.title',
        subtitleKey: 'profile.account.manageVehicles.subtitle',
        icon: 'car',
        action: 'manage-vehicles',
        roles: ['driver'],
      },
      {
        id: 'security',
        titleKey: 'profile.account.security.title',
        subtitleKey: 'profile.account.security.subtitle',
        icon: 'lock',
        action: 'security',
      },
      {
        id: 'delete-account',
        titleKey: 'profile.account.deleteAccount.title',
        subtitleKey: 'profile.account.deleteAccount.subtitle',
        icon: 'trash',
        action: 'delete-account',
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

const ADMIN_SETTINGS_ACTIONS: SettingsMenuAction[] = ['language', 'terms', 'privacy'];

function isMenuItemVisible(
  item: SettingsMenuItem,
  visibility: SettingsMenuVisibility,
): boolean {
  if (visibility.isAdmin) {
    return ADMIN_SETTINGS_ACTIONS.includes(item.action);
  }
  if (item.roles && !item.roles.includes(visibility.role)) {
    return false;
  }
  if (item.requiresDriverVerification && !visibility.hasDriverVerification) {
    return false;
  }
  if (item.requiresNoDriverVerification && visibility.hasDriverVerification) {
    return false;
  }
  return true;
}

export function getSettingsSectionsForRole(
  visibility: SettingsMenuVisibility,
): SettingsMenuSection[] {
  return SETTINGS_MENU_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => isMenuItemVisible(item, visibility)),
  })).filter((section) => section.items.length > 0);
}
