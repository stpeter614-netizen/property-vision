-- Property Vision V31
-- Reservation/payment authorization hardening.
-- No WOX database changes.

alter table if exists property_reservations enable row level security;

drop policy if exists buyer_read_own_reservations on property_reservations;
create policy buyer_read_own_reservations on property_reservations
for select to authenticated
using (buyer_user_id = auth.uid());

drop policy if exists developer_read_project_reservations on property_reservations;
create policy developer_read_project_reservations on property_reservations
for select to authenticated
using (
  exists (
    select 1
    from property_units pu
    join property_projects p on p.id = pu.project_id
    where pu.id = property_reservations.unit_id
      and is_developer_member(p.developer_id)
  )
);

-- Reservation/payment state changes must remain server-side.
revoke all on table property_reservations from anon;
revoke all on table property_reservations from authenticated;

revoke all on function confirm_property_payment(uuid,text,bigint) from public;
revoke all on function confirm_property_payment(uuid,text,bigint) from anon;
revoke all on function confirm_property_payment(uuid,text,bigint) from authenticated;

revoke all on function expire_property_reservations() from public;
revoke all on function expire_property_reservations() from anon;
revoke all on function expire_property_reservations() from authenticated;
