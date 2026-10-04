-- Property Vision V24
create table if not exists developers(id uuid primary key default gen_random_uuid(),name text not null,created_at timestamptz not null default now());
alter table if exists property_projects add column if not exists developer_id uuid references developers(id);
alter table if exists developer_members add column if not exists developer_id uuid references developers(id);
create index if not exists projects_developer_idx on property_projects(developer_id);
create index if not exists members_developer_idx on developer_members(developer_id);
create or replace function is_developer_member(p_developer_id uuid) returns boolean language sql stable security definer as $$
 select exists(select 1 from developer_members where developer_id=p_developer_id and user_id=auth.uid());
$$;
create or replace function developer_role(p_developer_id uuid) returns text language sql stable security definer as $$
 select role from developer_members where developer_id=p_developer_id and user_id=auth.uid() limit 1;
$$;
alter table if exists developers enable row level security;
alter table if exists property_projects enable row level security;
alter table if exists property_units enable row level security;