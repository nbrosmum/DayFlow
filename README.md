# DayFlow

A personal time management project: plan your day, finish important tasks, and track focused work.

The goal is an open source **native mobile app** built with **React Native + Expo**, with **Supabase Auth + PostgreSQL** for login and all persistent task and focus-session data. Android is the first target; iOS comes later.

## Current status

This repository currently contains a **web UI prototype**, not a working native mobile app.

- The prototype uses React, TypeScript, Next.js APIs, and the Vinext/Vite toolchain.
- You can add tasks and toggle completion in memory. Changes do not survive a page reload.
- Today, Week, Inbox, Routines, and Review show the intended design; several controls and statistics are demonstrations.
- The "Plan day" dialog contains a static example. It does not call an AI service.
- A web manifest and service worker are present. They do not provide native installation, persistent task storage, or reliable scheduled phone reminders.
- Drizzle schemas and Cloudflare D1 helpers exist, but the task UI is not connected to them.
- React Native, Expo, Supabase login, and cloud task storage are **planned**, not implemented. The native app will use Supabase as its only task database.

## Planned first version

- [ ] Add, edit, delete, and complete tasks.
- [ ] Set a planned date, priority, and estimated duration.
- [ ] View today's tasks and planned time blocks.
- [ ] Run a focus timer with a default 25-minute session.
- [ ] Schedule local reminders with notification permission.
- [ ] Add Supabase email/password login.
- [ ] Save each account's tasks and focus sessions in Supabase.
- [ ] Restrict access to the account's own data with Row Level Security.
- [ ] Show loading, connection errors, and retry options.
- [ ] Review completed tasks and daily focus minutes.
- [ ] Export and restore a JSON backup.
- [ ] Install a standalone Android app for personal use.

After the first version works:

- [ ] Refresh cloud data when returning to the app or using another device.
- [ ] Handle simultaneous edits and prevent duplicate submissions.
- [ ] Add recurring routines and a weekly review.
- [ ] Test and build for iOS.

## Planned technology

| Part | Tool | Purpose |
| --- | --- | --- |
| Language | JavaScript, then TypeScript | Learn the foundations, then add types |
| Mobile UI | React Native + Expo | Native Android and iOS screens |
| Navigation | Expo Router | Move between screens |
| Authentication | Supabase Auth | Sign in to a personal account |
| Database | Supabase PostgreSQL | Store tasks and focus sessions in the cloud |
| Reminders | expo-notifications | Schedule notifications locally |
| Development | Node.js LTS + npm | Run tooling and manage dependencies |
| Version history | Git + GitHub | Track progress and share source |

Node.js runs development tools and can support a future API. The native app itself runs through React Native, rather than a Node.js server on the phone. A separate Node.js backend is not required for basic Supabase access.

## Architecture

The native app connects directly to Supabase through its JavaScript client. Supabase Auth manages sign-in, and PostgreSQL stores tasks and focus sessions. Row Level Security restricts records to their owner.

There is no local task database or offline write queue. Loading data after reopening the app and saving changes require an internet connection. Keep the current screen's data in memory, report failed saves clearly, and refresh from Supabase when the app returns to the foreground. Disable unsupported actions offline rather than claiming unsaved changes have been stored.

Already scheduled local reminders can still fire without internet. A focus timer can continue using its known end time while the app remains active, but saving its result to Supabase requires a connection. Small device storage for authentication sessions or timer recovery may still be used; it is not a second task database.

For the focus timer, store the session's end timestamp and calculate the remaining time when the app resumes. Do not rely on a JavaScript interval continuing while the phone is locked.

Store timestamps consistently and display them in the user's timezone. Keep calendar dates, such as "planned for today," distinct from exact timestamps.

## Learning roadmap

Allow about **8-10 weeks at one hour a day**, adjusting the pace as needed. Finish each small working feature before moving on.

| Time | Learn | Deliverable |
| --- | --- | --- |
| Weeks 1-2 | JavaScript functions, arrays, objects, dates, promises, async/await | A task list that filters unfinished tasks |
| Week 3 | Node.js, npm, modules, JSON files, Git, basic TypeScript | A command-line task manager that saves a JSON file |
| Weeks 4-5 | React state and components, React Native layouts, Expo navigation | Today, Tasks, Focus, and Settings screens running on a phone |
| Week 6 | Supabase login, PostgreSQL tables, Row Level Security | Sign in and create/read only the account's own tasks |
| Week 7 | Timer lifecycle, notification permissions, local reminders | A focus session and a reminder tested on a real phone |
| Week 8 | Cloud updates, loading states, network errors, foreground refresh | Edit/delete tasks and save focus sessions with clear failure handling |
| Weeks 9-10 | Backup/restore, account isolation, debugging, Android builds | Verify cloud persistence and install a standalone app on the phone |

First exercise: create three tasks in JavaScript and print only unfinished tasks.

## Working with this repository

The following commands start the **existing web prototype**, not the planned native app.

Prerequisites: Git, npm, and a Node.js LTS release satisfying the current package requirement of Node.js 22.13.0 or newer.

```bash
git clone https://github.com/nbrosmum/DayFlow.git
cd DayFlow
npm ci
npm run dev
```

Open the local address printed by the development server.

Available scripts:

```bash
npm run lint
npm run build
npm run start
npm run db:generate
```

The database helper expects a Cloudflare D1 binding. The existing web hosting configuration is specific to the prototype's toolchain; it is not an Expo or Vercel deployment setup.

### Starting the native app later

Keep the prototype for reference and create the native app in a separate `mobile/` folder:

```bash
npx create-expo-app@latest mobile
cd mobile
npx expo start
```

These are future setup steps. The `mobile/` folder does not exist yet. Select the current template and SDK using the [Expo setup guide](https://docs.expo.dev/get-started/create-a-project/), then commit the generated lockfile.

Use Expo Go for early learning where supported. Use a development build when testing native configuration, then create a standalone Android build for personal installation. Test reminders and timer recovery on a real phone.

Windows supports Android development. Local iOS builds require macOS and Xcode. See [Expo local development](https://docs.expo.dev/guides/local-app-development/) and [release builds](https://docs.expo.dev/guides/local-app-production/).

## Supabase setup plan

No Supabase project or credentials are configured by this README.

When the native app is implemented:

1. Create a Supabase project and configure email/password authentication.
2. Create task and focus-session tables with an owner `user_id`.
3. Enable Row Level Security on exposed tables and create ownership policies for reading, inserting, updating, and deleting records.
4. Use the project URL and **publishable key** in the mobile client.
5. Keep secret and service-role keys on trusted servers only.
6. Test with two accounts to confirm that one account cannot access the other's data.

Expo public environment variables are included in the app bundle. They cannot hide secrets. Keep local environment files out of Git; the existing `.gitignore` ignores `.env*`.

Follow the current [Supabase React Native guide](https://supabase.com/docs/guides/auth/quickstarts/react-native) and [Row Level Security documentation](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Cost and deployment

- **Backend:** Supabase hosts authentication and the database. A separate Node.js server is unnecessary for the first version.
- **Supabase:** the hosted Free plan is $0 within its quotas. At the time of writing, it includes a 500 MB database and 1 GB file storage; inactive projects may pause after one week. Check [current pricing](https://supabase.com/pricing).
- **Vercel:** optional for a future companion website or API. It is not required to install the native mobile app. Hobby is free for personal, non-commercial projects within its limits. See [Hobby rules](https://vercel.com/docs/plans/hobby).
- **Android:** plan to build and install an APK for personal use; publishing to an app store is a separate step.
- **iOS:** device signing and distribution have additional requirements. Do not assume that open source libraries make every distribution method free.
- **Cloud build services, domains, and AI APIs:** optional and may cost money. AI is outside the first version.

Supabase is open source and can be [self-hosted](https://supabase.com/docs/guides/self-hosting), but you still maintain and pay for your own infrastructure when applicable. Hosted services, phone operating systems, and some platform tools are proprietary.

## Manual acceptance checks

Before calling the native first version complete:

- Add, edit, complete, and delete a task.
- Close and reopen the app online; saved changes are loaded from Supabase.
- Turn off the connection; show a clear offline state and do not report failed changes as saved.
- Restore the connection and retry; confirm only one record is created.
- Lock the phone during a focus session; remaining time is correct on return.
- Test reminder permission granted and denied.
- Edit or delete a task; its old reminder is rescheduled or cancelled.
- Export data, restore it, and check that tasks and focus sessions match.
- Refresh on another signed-in device; confirm it shows the latest cloud data.
- Sign out and confirm another account cannot see the previous account's in-memory or cloud data.

## Learning resources

- [JavaScript guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide)
- [Node.js learning guide](https://nodejs.org/learn)
- [React learning guide](https://react.dev/learn)
- [React Native documentation](https://reactnative.dev/docs/getting-started)
- [Expo tutorial](https://docs.expo.dev/tutorial/introduction/)
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Supabase documentation](https://supabase.com/docs)

## License

DayFlow's original project code is licensed under the [MIT License](LICENSE). Third-party dependencies retain their own licenses.
