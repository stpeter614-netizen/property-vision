-- Property Vision V46
-- Keep property asset metadata tenant-scoped and prevent arbitrary authenticated reads.
-- Asset files themselves should remain private and be delivered through signed storage URLs.

alter table if exists property_assets enable row level security;

drop policy if exists property_assets_developer_read on property_assets;
create policy property_assets_developer_read
on property_assets
for select
to authenticated
using (
  exists (
    select 1
    from property_projects p
    where p.id = property_assets.project_id
      and is_developer_member(p.developer_id)
  )
);

drop policy if exists property_assets_developer_manage on property_assets;
create policy property_assets_developer_manage
on property_assets
for all
to authenticated
using (
  exists (
    select 1
    from property_projects p
    where p.id = property_assets.project_id
      and developer_role(p.developer_id) in ('owner','admin','manager')
  )
)
with check (
  exists (
    select 1
    from property_projects p
    where p.id = property_assets.project_id
      and developer_role(p.developer_id) in ('owner','admin','manager')
  )
);
