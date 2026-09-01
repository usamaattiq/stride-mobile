# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

## What this is

`musafir249` (repo directory `stride-mobile`) is an Expo (SDK 54) / React Native marketplace app for
comparing/booking trips (buses, vans, private rides). It has a real backend (REST + sockets) — this
is **not** a demo/local-only app. Implemented areas: auth (signup/login, OTP, MPIN, biometric),
a passenger/driver dashboard (home feed, trip search & booking/RFQ/auction, vehicle listings,
messaging, credits, settings), and a separate admin panel.

## Stack

- Expo `~54.0.36`, React Native `0.81.5`, React `19.1.0`, TypeScript `~5.9.2` (strict mode)
- Navigation: `@react-navigation/native` + `native-stack` + `bottom-tabs` (no `expo-router`)
- State: `zustand` stores under `src/store/` (see "State management" below)
- Networking: `axios` (`src/services/api/client.ts` + per-domain API modules) and `socket.io-client`
  (`src/services/socket/chatSocket.ts`) for realtime chat
- i18n: `i18next` / `react-i18next`, English + Arabic bundles, device-language detection via
  `expo-localization`, persisted via `AsyncStorage`
- Fonts: Outfit (Latin) / Cairo (Arabic), loaded via `expo-font` and swapped per-language in `AppText`
- Auth mechanisms: OTP (signup/login), MPIN (`LoginMpinScreen` + forgot-MPIN flow), and biometric
  unlock (`useBiometricLogin`, `useDeviceBiometric`, `expo-local-authentication`) — session token is
  persisted via `expo-secure-store` and treated as sufficient proof of identity on cold start (see
  `App.tsx` bootstrap, below)
- Push notifications (`expo-notifications`, FCM via `google-services.json`) with deep-link routing
  (`src/services/pingDeepLinkRouting.ts`) into specific screens
- No test runner, linter, or formatter config currently present. `npm run {start,android,ios,web}`
  are the only dev scripts; `build:*`/`submit:*`/`update:*` scripts wrap EAS build/submit/update.

## Path aliases

`@/*` → `src/*` (configured in `tsconfig.json`). Always import via `@/...` for anything under `src`,
not relative paths that cross feature boundaries.

## Project structure

```
App.tsx                  # root: fonts + i18n init, cold-start session bootstrap, mounts AuthNavigator
index.ts                 # registerRootComponent entrypoint
src/
  navigation/
    navigationRef.ts      # global nav ref used by push-notification deep-link routing
  features/
    auth/
      components/          # AuthScaffold-adjacent building blocks (AuthCard, OtpInput, ProfilePhotoPicker, ...)
      constants/            # countries.ts, welcome.ts
      hooks/                 # useBiometricLogin, useLocationMapPicker
      navigation/            # AuthNavigator (root native-stack), types.ts (AuthStackParamList)
      screens/               # Welcome, Signup{Phone,Otp,PersonalInfo,Documents,Security,Success}, Login{Otp,Mpin,Forgot*}
      types/signup.types.ts  # SignupDraft shape
      utils/                  # location/geocode helpers for the signup address step
    dashboard/               # the main app once signed in — passenger + driver experience
      navigation/             # DashboardNavigator (bottom-tabs: Home/MyListings/CreateTrip/MyOffers/Settings),
                               # HomeStackNavigator, SettingsStackNavigator, VehicleStackNavigator
      screens/                # trip creation/publish, vehicle list/view, security settings, etc.
      components/             # home feed panels, trip search/route map, vehicle pickers, sliders, banners
      context/, constants/, types/, utils/
    admin/                    # separate admin panel (users, trips, credits, bank accounts)
      navigation/AdminNavigator.tsx (own bottom-tabs), screens/, components/, hooks/, constants/, utils/
  services/
    api/                    # axios client (client.ts) + one module per domain: auth, admin, trip, rfq,
                             #   auction, chat, credits, notifications, upload, vehicle (+ *.types.ts, apiError.ts)
    socket/chatSocket.ts     # socket.io client for realtime chat
    storage/deviceStorage.ts # AsyncStorage/secure-store wrappers
    deviceId.ts, locationPermission.ts, pushNotifications.ts, pingDeepLinkRouting.ts, sessionRevokedHandler.ts
  store/                    # zustand stores: authStore, adminStore, profileStore, devicePrefsStore,
                             #   signupDraftStore, loginFlowStore
  i18n/
    constants/            # languages.ts (SupportedLanguageCode = 'en' | 'ar'), legal-section-keys.ts
    hooks/useLanguage.ts   # currentLanguage / isRTL / setLanguage
    services/              # language.service.ts (resolve/apply/persist language), cache.service.ts (AsyncStorage)
    locales/{en,ar}.json    # flat translation bundles, namespace "translation"
    index.ts                # initializeI18n() — call once, awaited by App.tsx before render
  shared/
    components/            # AppText, Button, AppTopBar, AppBottomSheet, BrandLogo, KeyboardDoneBar,
                            #   BiometricToggleRow, SecuritySetupForm, language-switcher/, legal/
    config/                # env.ts (API base URL etc.), compliance.ts
    hooks/                  # useLegalDocumentSheets, useDeviceBiometric, useKeyboardVisible, ...
    utils/
  theme/                   # colors.ts, spacing.ts, radius.ts, typography.ts, index.ts (barrel + `theme` object)
  assets/fonts/            # Outfit-*.ttf, Cairo-*.ttf
```

### Feature-folder convention

Features follow the same shape: `components/`, `constants/`, `navigation/`, `screens/`, `types/` as
needed — don't dump everything in one file. Signup is still handled as one flow screen that swaps
step content via local state/store (see "Navigation" below) rather than separate stack pushes; new
multi-step flows (e.g. trip creation) should follow the same pattern unless there's a strong reason
to use real stack screens instead.

## Navigation

Root: `AuthNavigator` is a native-stack navigator with routes `Welcome`, `SignupFlow`,
`SignupSuccess`, `LoginFlow`, `Dashboard` (nested), `Admin` (nested) — see
`src/features/auth/navigation/types.ts` (`AuthStackParamList`), the one source of truth for root
route params.

- **Signup/login step flow**: `SignupFlowScreen` / `LoginFlowScreen` swap step content via internal
  state (backed by `signupDraftStore` / `loginFlowStore`), not by pushing new stack screens.
  `SignupFlowScreen` wires Android hardware back + navigation `beforeRemove` to step backward through
  `STEP_ORDER` before actually leaving the flow.
- **Dashboard**: `DashboardNavigator` (bottom-tabs) → `DashboardTabParamList` (Home, MyListings,
  CreateTrip, MyOffers, Settings). `Home` and `Settings` each nest their own native-stack
  (`HomeStackNavigator`, `SettingsStackNavigator`); vehicle screens have their own
  `VehicleStackNavigator`. Types live in `src/features/dashboard/navigation/{types,homeTypes,
  settingsTypes,vehicleNavigation.types,dashboardRootTypes}.ts`.
- **Admin**: separate `AdminNavigator` (own bottom-tabs) — completely independent from the
  passenger/driver dashboard tree.
- **Cold start routing** (`App.tsx`): after fonts/i18n are ready, `devicePrefsStore.hydrate()` then
  `authStore.hydrate()` run; a stored token skips straight to `Dashboard` (or `Admin`, based on
  `sessionKind`) with no MPIN/biometric re-prompt — no token routes to `Welcome`. A failed
  `getMe()` call clears session/profile stores and falls back to `Welcome`. Push notification
  registration/unregistration is tied to this same branch.

## State management

- `zustand` stores live in `src/store/`: `authStore` (session/token/sessionKind),
  `adminStore` (admin profile), `profileStore` (passenger/driver profile), `devicePrefsStore`
  (device-level prefs, hydrated at cold start), `signupDraftStore` (in-progress signup wizard state,
  replaces the old React-context approach), `loginFlowStore` (in-progress login wizard state).
- Prefer adding a new store over introducing React Context for cross-screen state — that's the
  established pattern now.

## API / networking

- `src/services/api/client.ts` is the shared axios instance; one module per backend domain
  (`authApi`, `adminApi`, `tripApi`, `rfqApi`, `auctionApi`, `chatApi`, `creditsApi`,
  `notificationsApi`, `uploadApi`, `vehicleApi`), each with a co-located `*.types.ts`. Errors are
  normalized via `apiError.ts` / `errorMessage.ts` — reuse those instead of ad hoc error handling.
- Realtime chat goes over `socket.io-client` (`src/services/socket/chatSocket.ts`), not polling.
- API base URL / environment config lives in `src/shared/config/env.ts`. Production/preview
  builds set `EXPO_PUBLIC_API_BASE_URL` in `eas.json` (`https://api.mazadalsafar.com/api`) —
  keep it in sync if the API domain changes.

## Theming

- Everything lives under `@/theme`: `colors`, `spacing`, `radius`, `typography` (all `as const`),
  plus a `theme` barrel object. Use these tokens — don't hardcode hex/px values in new components.
- `colors.primary` is the brand red (`#B42318`); pressed/muted/disabled/soft variants exist —
  reuse them instead of deriving new shades inline.
- **Do not set `fontWeight` directly.** Typography uses two font families switched by language
  (Outfit for `en`, Cairo for `ar`); weight is expressed via `AppText`'s `weight` prop
  (`'regular' | 'medium' | 'semibold' | 'bold'`), which resolves to the correct font file via
  `getFontFamily(currentLanguage, weight)`. Always render user-facing text through `AppText`,
  never a bare RN `Text`.
- Style objects are colocated with their component via `StyleSheet.create` at the bottom of the
  file — keep following that layout rather than introducing a separate styles module per component.

## i18n / localization

- Supported languages: `en` (default), `ar`. Add new languages in
  `src/i18n/constants/languages.ts` (`SUPPORTED_LANGUAGES`) — everything else (font mapping,
  resource loading, device-language normalization) keys off that list.
- Translation bundles are flat JSON under `src/i18n/locales/{en,ar}.json`, single namespace
  `"translation"`. Use `useTranslation(undefined, { i18n: appI18n })` (imported from `@/i18n`) in
  components — not the bare `react-i18next` default export — since i18n is initialized manually
  in `App.tsx`, not via a global side-effect import.
- Language selection is persisted (`cache.service.ts` via AsyncStorage) and re-applied on launch
  in `initializeI18n()`; device language is only used as a fallback for first launch.
- `isRTL` is tracked per-language (`SupportedLanguage.isRTL`) but both `en` and `ar` are currently
  marked `isRTL: false` — RTL layout mirroring is not actually wired up yet. Don't assume Arabic
  renders RTL without checking this first if you're asked to add RTL support.
- New user-facing strings must go in **both** locale files, never hardcoded in components.

## Settings nested screens

Screens opened from Settings (Security, Driver verification, General information, …) use
**`AuthScaffold` (red header) + `AuthCard`**, not `AppTopBar`. Register on `SettingsStackNavigator`,
navigate from the menu — see `.cursor/rules/settings-nested-screens.mdc`.

## Conventions / gotchas

- This codebase is being ported from/kept in sync with a sibling project referred to as **bt-app**
  in comments (see `AuthNavigator.tsx`) — when a comment says "match bt-app", treat that pattern as
  intentional/required, not incidental.
- Auth is real, not local-only: OTP/MPIN/biometric flows call the actual API (`authApi`) and persist
  a session token via `expo-secure-store`; don't assume signup/login just mutate in-memory state.
- No test framework, ESLint, or Prettier config is set up. If asked to add lint/test tooling,
  confirm the preferred stack rather than assuming Jest/ESLint defaults.
- Native `ios/` and `android/` folders are gitignored (not prebuilt) — this is a managed Expo
  workflow app; don't hand-edit native projects, use `expo prebuild`/config plugins instead. Native
  permission/purpose strings (photo library, camera, location, Face ID) are configured via the
  `app.json` `plugins` array (`expo-image-picker`, `expo-location`, `expo-local-authentication`),
  not hand-edited `Info.plist`/`AndroidManifest.xml`.
- `number-pad`/`phone-pad` keyboards have no return key on iOS, so there's no built-in way to
  dismiss them. Pair every such `TextInput` with `@/shared/components/KeyboardDoneBar` (renders
  `null` on Android — not needed there) via `inputAccessoryViewID` + a matching `nativeID`
  (use `React.useId()`). Set `disabled` to the exact same condition that enables the screen's own
  action button (not just "non-empty"), and pass `onDone` as that same action — Done should submit/
  advance exactly like pressing the CTA, not just dismiss the keyboard. See `PhoneInput` and
  `IdentityDocumentVerification` for the pattern.
