# DayFlow native app implementation

Build the agreed personal time management app in `mobile/` using Expo Router,
React Native, TypeScript, and Supabase as the only task database.

## First usable version

- Today: current date, completion progress, planned tasks, quick add, daily review.
- Tasks: search, status filters, create/edit/delete, priority, duration, date/time.
- Focus: task selection, timestamp-based timer, pause/resume, session history.
- Settings: email/password sign-in/sign-up, account state, refresh, JSON backup.
- Native local notifications for dated tasks and focus completion.
- Supabase Auth and ownership-protected task/focus tables; no SQLite or task cache.

An explicitly labelled in-memory preview works before Supabase is configured.
Preview changes reset when the app restarts and are never represented as cloud saves.
Configured mode requires sign-in and network access for persistent data changes.
Use AsyncStorage only for auth sessions, timer recovery, and device reminder IDs.

## Implementation sequence

1. Test date validation, task filtering, timer recovery, and backup validation.
2. Build domain helpers, Supabase client/repository, auth/data provider.
3. Add native reminders and recoverable focus state.
4. Build shared UI, tab routes, and task editor.
5. Supply SQL setup, environment example, and connection instructions.
6. Run tests, lint, TypeScript, and Android JavaScript bundling. Verify the UI
   through a browser preview where available; phone-only behavior needs a device.

## Validation boundaries

No cloud project is currently available through the connector. Cloud writes and
RLS must be verified after the user connects a project. Do not deploy an invented
project or claim live cloud verification. Do not delete the web prototype.
