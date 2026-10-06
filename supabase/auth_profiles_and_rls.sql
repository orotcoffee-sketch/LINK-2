-- profiles + RLS. Supabase SQL Editor 에서 직접 확인 후 실행한다. (자동 실행하지 않음)
-- 기존 folders / bookmarks / link 데이터는 삭제하지 않는다.

-- profiles: auth.users 와 1:1, 비밀번호 등 인증정보는 저장하지 않는다.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'member' constraint profiles_role_check check (role in ('member', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 신규 가입자는 항상 member (role 컬럼 기본값 사용)
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 기존 사용자가 있으면 member 로 채운다 (admin 아님)
insert into public.profiles (id) select id from auth.users on conflict (id) do nothing;

-- 관리자 판별: profiles.role = 'admin' AND 이메일 인증 완료.
-- security definer 라 profiles RLS 를 우회하므로 정책 재귀가 생기지 않는다.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    join auth.users u on u.id = p.id
    where p.id = (select auth.uid())
      and p.role = 'admin'
      and u.email_confirmed_at is not null
  );
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.folders enable row level security;
alter table public.bookmarks enable row level security;

-- profiles: 본인 row 읽기만. INSERT/UPDATE/DELETE 정책 없음 → role 직접 변경 불가.
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));

-- folders
create policy "folders_select_all" on public.folders for select to anon, authenticated using (true);
create policy "folders_insert_admin" on public.folders for insert to authenticated with check ((select public.is_admin()));
create policy "folders_update_admin" on public.folders for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "folders_delete_admin" on public.folders for delete to authenticated using ((select public.is_admin()));

-- bookmarks
create policy "bookmarks_select_all" on public.bookmarks for select to anon, authenticated using (true);
create policy "bookmarks_insert_admin" on public.bookmarks for insert to authenticated with check ((select public.is_admin()));
create policy "bookmarks_update_admin" on public.bookmarks for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "bookmarks_delete_admin" on public.bookmarks for delete to authenticated using ((select public.is_admin()));

-- ─────────────────────────────────────────────────────────────
-- 최초 관리자 지정 (자동 실행 금지: 이메일을 본인 것으로 바꿔 직접 실행)
-- update public.profiles set role = 'admin', updated_at = now()
--   where id = (select id from auth.users where email = '여기에-본인-이메일');
