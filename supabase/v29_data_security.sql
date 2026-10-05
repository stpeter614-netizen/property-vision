-- Property Vision V29
-- Security hardening for tenant-owned assets, leads and analytics.
-- Does not change the WOX database.

-- Developer members remain tenant-scoped. Only members can read their own membership.
alter table if exists developer_members enable row level security;
drop policy if exists developer_member_self_read on developer_members;
create policy developer_member_self_read on developer_members
for select to authenticated
using (user_id = auth.uid());

-- Project assets are private developer data. Buyers receive assets through
-- server-side APIs / signed URLs, not direct table access.
alter table if exists property_assets enable row level security;
drop policy if exists developer_asset_read on property_assets;
create policy developer_asset_read on property_assets
for select to authenticated
using (
  exists (
    select 1
    from property_projects p
    where p.id = property_assets.project_id
      and is_developer_member(p.developer_id)
  )
);
drop policy if exists developer_asset_manage on property_assets;
create policy developer_asset_manage on property_assets
for all to authenticated
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

-- Buyer enquiries are developer-owned lead data. No direct public access:
-- the server API uses the service role after input validation.
alter table if exists property_enquiries enable row level security;
drop policy if exists developer_enquiry_read on property_enquiries;
create policy developer_enquiry_read on property_enquiries
for select to authenticated
using (
  project_id is not null
  and exists (
    select 1
    from property_projects p
    where p.id = property_enquiries.project_id
      and is_developer_member(p.developer_id)
  )
);
drop policy if exists developer_enquiry_manage on property_enquiries;
create policy developer_enquiry_manage on property_enquiries
for update to authenticated
using (
  project_id is not null
  and developer_role((
    select p.developer_id
    from property_projects p
    where p.id = property_enquiries.project_id
  )) in ('owner','admin','manager')
)
with check (
  project_id is not null
  and developer_role((
    select p.developer_id
    from property_projects p
    where p.id = property_enquiries.project_id
  )) in ('owner','admin','manager')
);

-- Analytics is write-only from the buyer experience through the server API.
-- Developer users can read only their own project's events.
alter table if exists property_analytics_events enable row level security;
drop policy if exists developer_analytics_read on property_analytics_events;
create policy developer_analytics_read on property_analytics_events
for select to authenticated
using (
  project_id is not null
  and exists (
    select 1
    from property_projects p
    where p.id = property_analytics_events.project_id
      and is_developer_member(p.developer_id)
  )
);

-- SECURITY DEFINER functions are never executable by anonymous/public callers.
revoke all on function save_property_configuration(uuid,text,numeric,jsonb,numeric) from public;
revoke all on function save_property_configuration(uuid,text,numeric,jsonb,numeric) from anon;
revoke all on function save_property_configuration(uuid,text,numeric,jsonb,numeric) from authenticated;

revoke all on function confirm_property_payment(uuid,text,bigint) from public;
revoke all on function confirm_property_payment(uuid,text,bigint) from anon;
revoke all on function confirm_property_payment(uuid,text,bigint) from authenticated;

revoke all on function expire_property_reservations() from public;
revoke all on function expire_property_reservations() from anon;
revoke all on function expire_property_reservations() from authenticated;

revoke all on function create_property_project(text,text,integer,integer,integer,numeric) from public;
revoke all on function create_property_project(text,text,integer,integer,integer,numeric) from anon;
revoke all on function create_property_project(text,text,integer,integer,integer,numeric) from authenticated;

-- These legacy checkout tables use the earlier "units" model. They are
-- intentionally not given developer policies here until the schema is
-- bridged to property_projects/property_units; guessing that relationship
-- would risk cross-tenant access.
