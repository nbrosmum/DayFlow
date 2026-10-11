-- Run once in a new Supabase project's SQL Editor. No service-role key is needed in the app.
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 160),
  notes text not null default '' check (length(notes) <= 2000),
  planned_date date,
  planned_time text check (planned_time is null or planned_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  minutes integer not null default 25 check (minutes between 1 and 480),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  completed boolean not null default false,
  reminder boolean not null default false,
  created_at timestamptz not null default now(),
  check (planned_time is null or planned_date is not null),
  check (not reminder or (planned_date is not null and planned_time is not null))
);
create index if not exists tasks_owner_date on public.tasks(user_id, planned_date);

create table if not exists public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id text not null check (length(client_id) between 1 and 100),
  task_title text not null check (length(task_title) <= 160),
  minutes numeric not null check (minutes between 0 and 480),
  completed_at timestamptz not null default now(),
  unique(user_id, client_id)
);
create index if not exists focus_owner_date on public.focus_sessions(user_id, completed_at);

alter table public.tasks enable row level security;
alter table public.focus_sessions enable row level security;
revoke all on public.tasks, public.focus_sessions from anon;
grant select, insert, update, delete on public.tasks, public.focus_sessions to authenticated;

drop policy if exists dayflow_tasks_select on public.tasks;
create policy dayflow_tasks_select on public.tasks for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists dayflow_tasks_insert on public.tasks;
create policy dayflow_tasks_insert on public.tasks for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists dayflow_tasks_update on public.tasks;
create policy dayflow_tasks_update on public.tasks for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists dayflow_tasks_delete on public.tasks;
create policy dayflow_tasks_delete on public.tasks for delete to authenticated using ((select auth.uid()) = user_id);
drop policy if exists dayflow_focus_select on public.focus_sessions;
create policy dayflow_focus_select on public.focus_sessions for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists dayflow_focus_insert on public.focus_sessions;
create policy dayflow_focus_insert on public.focus_sessions for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists dayflow_focus_update on public.focus_sessions;
create policy dayflow_focus_update on public.focus_sessions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists dayflow_focus_delete on public.focus_sessions;
create policy dayflow_focus_delete on public.focus_sessions for delete to authenticated using ((select auth.uid()) = user_id);

-- Atomic import: a failed row rolls the entire operation back. Ownership comes from auth.uid().
create or replace function public.restore_dayflow(backup jsonb)
returns void language plpgsql security invoker set search_path = public as $$
declare item jsonb;
begin
  if auth.uid() is null then raise exception 'Sign in before importing.'; end if;
  if backup->>'version' is distinct from '1' or jsonb_typeof(backup->'tasks') is distinct from 'array' or jsonb_typeof(backup->'sessions') is distinct from 'array' then raise exception 'Invalid backup format.'; end if;
  if jsonb_array_length(backup->'tasks') > 10000 or jsonb_array_length(backup->'sessions') > 10000 then raise exception 'Import at most 10000 records of each type.'; end if;
  for item in select value from jsonb_array_elements(backup->'tasks') loop
    insert into public.tasks(user_id, title, notes, planned_date, planned_time, minutes, priority, completed, reminder)
    values (auth.uid(), item->>'title', coalesce(item->>'notes', ''), nullif(item->>'planned_date', '')::date, nullif(item->>'planned_time', ''), (item->>'minutes')::integer, item->>'priority', (item->>'completed')::boolean, false);
  end loop;
  for item in select value from jsonb_array_elements(backup->'sessions') loop
    insert into public.focus_sessions(user_id, client_id, task_title, minutes, completed_at)
    values (auth.uid(), item->>'client_id', item->>'task_title', (item->>'minutes')::numeric, (item->>'completed_at')::timestamptz)
    on conflict(user_id, client_id) do nothing;
  end loop;
end;
$$;
revoke all on function public.restore_dayflow(jsonb) from public, anon;
grant execute on function public.restore_dayflow(jsonb) to authenticated;
