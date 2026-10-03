# Olivier & Deborah Wedding Invitation

A responsive wedding invitation website built with React, TypeScript, and Vite. It includes the animated envelope introduction, wedding story and details, gallery, guest RSVP form, and an admin dashboard.

## Local development

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set the existing Supabase project's URL and public publishable key:

   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_public_key
   ```

3. Start the development server with `npm run dev`.

Do not put a service-role key, secret key, password, or token in a `VITE_*` variable. `.env` files are ignored by Git; `.env.example` contains names and safe setup guidance only.

## Supabase RSVP and admin access

The browser client sends valid RSVP submissions to the existing `public.rsvps` table using `full_name`, `email`, `phone`, `attendance`, `guests`, `message`, and the database-generated `created_at`. Supabase is the source of truth; failed inserts are shown as errors and are not silently saved as local RSVPs.

Guests can insert but cannot read, update, or delete RSVP records. Admin sign-in uses Supabase Auth. The admin must have the trusted `app_metadata.role` value `wedding_admin`; row-level security protects RSVP reads and deletes. Never use `user_metadata` for authorization. Create/provision the Auth user and role through the trusted Supabase dashboard or SQL Editor, not frontend code.

The existing table is not created or altered by this app. Review and run `supabase/schema.sql` in the existing project only if its RLS setup needs the listed policies. The admin RSVP list subscribes to Realtime and also has manual refresh controls. More detail and verification SQL are in [supabase/README.md](supabase/README.md).

## Checks and production build

- `npm run lint`
- `npm run build`
- `npm run preview`

Set the same two public Supabase variables in the deployment build environment. Admin authentication and database access remain enforced by Supabase Auth and RLS, not by a client-side password.
