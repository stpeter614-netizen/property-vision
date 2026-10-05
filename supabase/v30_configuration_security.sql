-- Property Vision V30
-- Bridge security for the legacy configuration/reservation model.
-- The legacy model uses public.units, while the newer developer inventory
-- uses property_units. Do not expose cross-tenant rows until a deliberate
-- bridge exists.
-- No WOX database changes.

alter table if exists property_configurations enable row level security;

drop policy if exists buyer_configuration_read on property_configurations;
create policy buyer_configuration_read on property_configurations
for select to authenticated
using (
  exists (
    select 1
    from property_reservations r
    where r.configuration_id = property_configurations.id
      and r.buyer_user_id = auth.uid()
  )
);

drop policy if exists developer_configuration_read on property_configurations;
create policy developer_configuration_read on property_configurations
for select to authenticated
using (
  exists (
    select 1
    from property_reservations r
    join property_units pu on pu.id = r.unit_id
    join property_projects p on p.id = pu.project_id
    where r.configuration_id = property_configurations.id
      and is_developer_member(p.developer_id)
  )
);

-- Configuration writes remain server-side through validated APIs/functions.
revoke all on function save_property_configuration(uuid,text,numeric,jsonb,numeric) from public;
revoke all on function save_property_configuration(uuid,text,numeric,jsonb,numeric) from anon;
revoke all on function save_property_configuration(uuid,text,numeric,jsonb,numeric) from authenticated;

-- Prevent direct table writes from client roles.
revoke all on table property_configurations from anon;
revoke all on table property_configurations from authenticated;
