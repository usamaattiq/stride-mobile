# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

## What this is

`stride-mobile` is an Expo (SDK 54) / React Native app, currently implementing only the **auth flow**
(welcome → signup → login) with a placeholder home screen. No backend is wired up yet — signup/login
are demo/local-only (see `SignupDraftContext`, `Alert.alert('OTP resent', ...)`).

## Stack

- Expo `~54.0.35`, React Native `0.81.5`, React `19.1.0`, TypeScript `~5.9.2` (strict mode)
- Navigation: `@react-navigation/native` + `native-stack` (no `expo-router`)
- i18n: `i18next` / `react-i18next`, English + Arabic bundles, device-language detection via
  `expo-localization`, persisted via `AsyncStorage`
- Fonts: Outfit (Latin) / Cairo (Arabic), loaded via `expo-font` and swapped per-language in `AppText`
- No test runner, linter, or formatter config currently present. `npm run {start,android,ios,web}`
  are the only scripts (all just `expo start` variants).

## Path aliases

`@/*` → `src/*` (configured in `tsconfig.json`). Always import via `@/...` for anything under `src`,
not relative paths that cross feature boundaries.

## Project structure

```
App.tsx                  # root: waits on fonts + i18n init, hides splash, mounts AuthNavigator
index.ts                 # registerRootComponent entrypoint
src/
  features/auth/
    components/          # building blocks used only by auth screens (AuthScaffold, AuthTextField, OtpInput, PhoneInput, ProfilePhotoPicker, DocumentUploadField, ...)
    constants/            # countries.ts (calling codes / DEFAULT_COUNTRY), welcome.ts
    context/              # SignupDraftContext — in-memory draft state for the whole signup wizard
    navigation/           # AuthNavigator (the only navigator in the app), routes.tsx, types.ts (AuthStackParamList)
    screens/              # one screen per flow step, e.g. Signup{Phone,Otp,PersonalInfo,Documents,Security}Screen
    types/signup.types.ts # SignupDraft shape + createEmptySignupDraft + formatPhoneDisplay
  i18n/
    constants/            # languages.ts (SupportedLanguageCode = 'en' | 'ar'), legal-section-keys.ts
    hooks/useLanguage.ts   # currentLanguage / isRTL / setLanguage
    services/              # language.service.ts (resolve/apply/persist language), cache.service.ts (AsyncStorage)
    locales/{en,ar}.json    # flat translation bundles, namespace "translation"
    index.ts                # initializeI18n() — call once, awaited by App.tsx before render
  shared/
    components/            # AppText, Button, AppTopBar, AppBottomSheet, BrandLogo, language-switcher/, legal/
    hooks/useLegalDocumentSheets.tsx
  theme/                   # colors.ts, spacing.ts, radius.ts, typography.ts, index.ts (barrel + `theme` object)
  assets/fonts/            # Outfit-*.ttf, Cairo-*.ttf
```

### Feature-folder convention

New features should follow the same shape as `features/auth`: `components/`, `constants/`,
`navigation/`, `screens/`, `types/` as needed — don't dump everything in one file. Screens that are
really "steps" of one flow (like signup) live under one flow screen that swaps step content via
local state, not via separate stack pushes (see "Navigation" below).

## Navigation

- `AuthNavigator` is the single native-stack navigator, wrapping everything in `SignupDraftProvider`.
- Stack routes: `Welcome`, `SignupFlow`, `LoginFlow`, `HomePlaceholder` — that's it. Signup/login
  step changes happen **inside** `SignupFlowScreen` / `LoginFlowScreen` via internal `step` state,
  not by pushing new stack screens. This keeps one persistent `AuthScaffold` mounted and avoids
  remount jank between steps.
- `SignupFlowScreen` wires Android hardware back + navigation `beforeRemove` to step backward
  through `STEP_ORDER` before actually leaving the flow. Follow this pattern for any new
  multi-step flow rather than adding real stack screens per step.
- `AuthStackParamList` (`src/features/auth/navigation/types.ts`) is the one source of truth for
  route params — extend it when adding routes.

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

## Conventions / gotchas

- This codebase is being ported from/kept in sync with a sibling project referred to as **bt-app**
  in comments (see `AuthNavigator.tsx`) — when a comment says "match bt-app", treat that pattern as
  intentional/required, not incidental.
- No backend/API layer exists yet. Signup/login flows only mutate `SignupDraftContext` in memory
  and never persist or call a network endpoint — don't assume hidden services exist.
- No test framework, ESLint, or Prettier config is set up. If asked to add lint/test tooling,
  confirm the preferred stack rather than assuming Jest/ESLint defaults.
- Native `ios/` and `android/` folders are gitignored (not prebuilt) — this is a managed Expo
  workflow app; don't hand-edit native projects, use `expo prebuild`/config plugins instead.
