# Shared RSVP setup

The existing project and `public.rsvps` table were inspected. The table already has `id`, `full_name`, `email`, `phone`, `attendance`, `guests`, `message`, and `created_at`; the application maps directly to those columns.

1. Run `schema.sql` in the existing project's SQL Editor. It does not create or alter the table. It checks that RLS is already enabled, replaces its policies with public insert plus wedding-admin-only read/delete, and restricts table grants.
2. Add the project URL and its public publishable key to the ignored local `.env` and deployment environment:

   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_public_key
   ```

   Never use a `service_role` key in this frontend.
3. Create the wedding admin user in Supabase Authentication. Disable public sign-up if it is not needed.
4. Using the trusted Supabase SQL Editor, grant the admin role to that exact account:

   ```sql
   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"wedding_admin"}'::jsonb
   where email = 'the-admin-account-email';
   ```

   Replace the email with the account created in step 3. This must be run in the trusted Supabase SQL Editor, never in the browser. Sign in again after changing app metadata so the JWT receives the role claim.
5. Restart the Vite dev server after changing local environment variables. Add the same two public variables to the deployment build environment.

The public RSVP form can insert rows but cannot read or delete them. The admin UI signs in with Supabase Auth; row-level security allows read/delete only when the signed-in user's trusted `app_metadata.role` is `wedding_admin`. Realtime refreshes the dashboard after row changes when the existing table is in the project's Realtime publication; the Refresh buttons remain available as a fallback.

To verify trusted metadata and active policy expressions in the SQL Editor:

```sql
select email, raw_app_meta_data ->> 'role' as app_role
from auth.users
where email = 'the-admin-account-email';

select policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'rsvps'
order by cmd, policyname;
```

The expected policies are public `INSERT`, authenticated `SELECT`, and authenticated `DELETE`. The read/delete expressions must both equal `(auth.jwt() -> 'app_metadata' ->> 'role') = 'wedding_admin'`; there must be no `SELECT`, `UPDATE`, or `DELETE` policy for `anon`, and no `UPDATE` policy for ordinary authenticated users.

Admin access always uses Supabase Auth; there is no frontend password fallback. Keep public sign-up disabled and provision the admin role through the trusted Supabase dashboard/SQL editor; never use a service-role key in the frontend. The previous `VITE_ADMIN_PASSWORD` setting is removed so no admin password is embedded in the public Vite bundle.
