# DayFlow mobile

A native personal day planner built with React Native, Expo Router, and Supabase.

## Run it

```powershell
cd mobile
npm ci
npm start
```

Open the app using Expo Go on a compatible phone, or an Android development build.
The app has Today, Tasks, Focus, and Settings tabs. Task editing opens as a modal.

If Supabase is not configured, a clearly labelled in-memory preview is available.
You can create, edit, complete, and delete sample tasks and try the focus timer.
Preview task changes and focus history reset on restart. Timer recovery metadata
is kept separately on the device; it is not a local task database.

## Connect Supabase

1. Create a project at https://supabase.com/dashboard.
2. Run `supabase/schema.sql` in that project's SQL Editor. It creates task and
   focus-session tables, ownership policies, and an atomic backup import function.
3. Copy `.env.example` to `.env` in this folder.
4. Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` using
   the project connection settings. Use a publishable key, never a secret or
   service-role key. Public variables are bundled into the app.
5. Restart Expo with `npm start -- --clear`.
6. Open Settings, create your account, confirm its email if required, and sign in.

Supabase is the only persistent task database. Internet is required to load and
save cloud data. Failed writes display an error and are not shown as saved.
The app refreshes when it returns to the foreground and supports pull-to-refresh.

Before relying on the backend, test with two accounts and verify that neither
account can read or modify the other's tasks or sessions. The cloud configuration
has not been exercised against a live project yet.

## Reminders and focus

Set a task's date and 24-hour time, then enable its reminder. Notifications are
scheduled on the current phone after the task is saved. Complete, edit, or delete
a task to update its reminder. Reminders are not automatically scheduled on other
devices. Check permission in Settings. Browser previews do not send notifications.

The focus timer uses an end timestamp, supports pause/resume, and recovers after
reopening the app. Finish a session and choose Save session to store its history
in Supabase. If saving fails, the session stays available for retry. Repeating a
save uses the same client ID to avoid duplicate sessions.

Test notifications, phone-lock recovery, and denied permissions on a real device.
Platform power-saving settings can affect reminder timing. This project does not
use remote push notifications.

## Backup

Settings can export loaded tasks and focus sessions as a version 1 JSON backup.
Refresh cloud data before exporting. Import adds tasks as copies and leaves
existing tasks in place. Repeated session IDs are not duplicated in cloud mode.
Restored task reminders are disabled until you edit the tasks on this phone.
Imports are limited to 10000 tasks and 10000 sessions, and 5 MB per file.

## Checks

```powershell
npm test
npm run lint
npm run typecheck
npx expo install --check
npx expo export --platform android --output-dir dist/android
```

The behavior tests require Node.js 22.13 or newer. For browser interaction checks,
start `npx expo start --web --offline --port 8082` in another terminal, then run:

```powershell
npx playwright test --reporter=line
```

Playwright is configured to use the installed Microsoft Edge browser headlessly
at a 390 x 844 viewport. On another OS, change its browser channel in
`playwright.config.cjs` to an installed Chromium browser.

An Android JavaScript export validates bundling; it is not an installable APK.
A signed APK or iOS app still needs a native development/release build. Local iOS
builds require macOS and Xcode. No store submission or paid cloud build is included.

Dependency installation reported 30 audit findings (12 moderate and 18 high).
These remain unresolved; review `npm audit` and Expo-compatible fixes before
distributing a release.

## Main files

- `src/app/(tabs)/index.tsx`: Today screen.
- `src/app/(tabs)/tasks.tsx`: search and filters.
- `src/app/(tabs)/focus.tsx`: focus timer and history.
- `src/app/(tabs)/settings.tsx`: account, backup, and notifications.
- `src/app/task.tsx`: task editor.
- `src/state/dayflow.tsx`: account-scoped cloud data and preview state.
- `src/state/focus.tsx`: timer lifecycle and recovery.
- `src/lib/domain.ts`: validation, filtering, and countdown calculations.
- `src/lib/supabase.ts`: client configuration.
- `supabase/schema.sql`: backend setup.

The web prototype in the repository root remains a separate reference project.
