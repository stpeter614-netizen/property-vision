-- Property Vision V28
-- Developer tenant authorization hardening.
-- Apply after V24.

create or replace function is_developer_member(p_developer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from developer_members
    where developer_id = p_developer_id
      and user_id = auth.uid()
  );
$$;

create or replace function developer_role(p_developer_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from developer_members
  where developer_id = p_developer_id
    and user_id = auth.uid()
  limit 1;
$$;

revoke all on function is_developer_member(uuid) from public;
revoke all on function developer_role(uuid) from public;
grant execute on function is_developer_member(uuid) to authenticated;
grant execute on function developer_role(uuid) to authenticated;

alter table developers enable row level security;
alter table property_projects enable row level security;
alter table property_units enable row level security;
alter table developer_members enable row level security;

drop policy if exists developer_self_read on developers;
create policy developer_self_read on developers
for select to authenticated
using (is_developer_member(id));

drop policy if exists developer_project_read on property_projects;
create policy developer_project_read on property_projects
for select to authenticated
using (is_developer_member(developer_id));

drop policy if exists developer_project_manage on property_projects;
create policy developer_project_manage on property_projects
for all to authenticated
using (developer_role(developer_id) in ('owner','admin','manager'))
with check (developer_role(developer_id) in ('owner','admin','manager'));

drop policy if exists developer_unit_read on property_units;
create policy developer_unit_read on property_units
for select to authenticated
using (
  exists (
    select 1
    from property_projects p
    where p.id = property_units.project_id
      and is_developer_member(p.developer_id)
  )
);

drop policy if exists developer_unit_manage on property_units;
create policy developer_unit_manage on property_units
for all to authenticated
using (
  exists (
    select 1
    from property_projects p
    where p.id = property_units.project_id
      and developer_role(p.developer_id) in ('owner','admin','manager')
  )
)
with check (
  exists (
    select 1
    from property_projects p
    where p.id = property_units.project_id
      and developer_role(p.developer_id) in ('owner','admin','manager')
  )
);
