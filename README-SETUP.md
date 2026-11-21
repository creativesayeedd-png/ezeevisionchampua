# EZEE VISION CHAMPUA — Login & Sign-up starter

This starter contains the first authentication foundation for the Expo React Native app.

## Included files

- `App.tsx` — Blue + Orange Teacher / Parent login and Parent registration UI, Supabase sign-in/sign-up, password recovery request, session restore, role check, and signed-in placeholder portal.
- `src/lib/supabase.ts` — Supabase client with persistent React Native auth storage.
- `supabase/schema.sql` — `profiles` table, row-level security, and a database trigger that creates public sign-ups as `parent` only.
- `.env.example` — sample environment variable names. It contains no real credentials.

## 1. Install dependencies

Run these commands from the Expo app folder (`mobile-app`):

```bash
npx expo install @react-native-async-storage/async-storage react-native-url-polyfill
npm install @supabase/supabase-js
```

## 2. Create and configure Supabase

1. Create a Supabase project at https://supabase.com/.
2. Open **SQL Editor** in the Supabase Dashboard.
3. Open `supabase/schema.sql` from this starter, copy its contents, and run them in SQL Editor.
4. In Supabase, find the Project URL and **publishable key** (the newer `sb_publishable_...` key, or the legacy anon/public key if your dashboard only exposes that).
5. In the `mobile-app` root folder, create a file named `.env` using `.env.example` as the pattern:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

Replace the placeholders with your actual values. Do not add quotes around them.

**Never put a Supabase service-role or secret key in the app, `.env` values prefixed with `EXPO_PUBLIC_`, screenshots, or chat.** The publishable/anon key is designed for client use only when Row Level Security is correctly enabled.

## 3. Replace / add files in the existing Expo project

Copy these files into the existing project:

- Replace `mobile-app/App.tsx` with this starter's `App.tsx`.
- Create `mobile-app/src/lib/` and put `supabase.ts` inside it.
- Create `mobile-app/supabase/` and put `schema.sql` inside it (for reference and future migrations).
- Create `mobile-app/.env` from `.env.example` and fill in your Supabase values.

Keep your existing `app.json`, `package.json`, `tsconfig.json`, `assets/`, and other Expo files. Do not replace the whole Expo project with this folder.

## 4. Create the one Teacher account (owner-only)

Teacher sign-up is deliberately disabled in the app. This is a single-owner coaching app.

1. In Supabase Dashboard, open **Authentication → Users → Add user**.
2. Create the owner's teacher account with the intended email and password. Confirm the email in the dashboard if the option is available.
3. The database trigger creates a profile with role `parent` initially.
4. In SQL Editor, run the owner-only promotion query from the bottom of `supabase/schema.sql`, replacing `YOUR_TEACHER_EMAIL@example.com` with the exact teacher email.
5. Re-open the app and sign in using the Teacher portal option.

Only the project owner should run the teacher-promotion SQL. Do not build a public teacher registration option.

## 5. Parent / Guardian registration

1. Select **Parent / Guardian**.
2. Select **Create Account**.
3. Enter parent name, 10-digit mobile number, email, and password.
4. If Supabase email confirmation is enabled, ask the parent to confirm their email before signing in.
5. Public sign-ups receive the `parent` role through the database trigger. The app does not accept a role from the signup form.

This first phase does not yet link a parent to a student. Parent-child linking and teacher approval will be implemented in the next backend phase. Until approved, no child records should be shown.

## 6. Restart Expo after adding `.env`

Stop the running Expo server from the terminal, then run from `mobile-app`:

```bash
npx expo start --tunnel --clear
```

Open/reload the app in Expo Go. Expo loads `EXPO_PUBLIC_` variables from the `.env` file at bundling time; a restart/full reload is needed after changing them.

## Authentication behavior in this phase

- Teacher: sign-in only; teacher user is created by the owner in Supabase Dashboard.
- Parent / Guardian: sign-in and public sign-up.
- Selected portal is checked against the profile role after login.
- Auth sessions are persisted using AsyncStorage.
- Profile reads are restricted by RLS to the signed-in user's own profile.
- Forgot password sends a Supabase password recovery email. A polished in-app password-reset return flow requires a configured app deep link and will be completed before production release.
- Signed-in screen is a placeholder. Teacher modules and parent-child dashboard will be added later.

## Important limits

This is the first authentication foundation only. It does not yet include student records, fee/attendance/results tables, parent-child relationship requests, receipt PDFs, or bulk reports. Those will be added in later phases with their own database schema and RLS policies.
