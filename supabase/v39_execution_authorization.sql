-- Property Vision V39
-- Execution authorization and provider tenant-isolation hardening.

create or replace function property_set_work_order_status(
  p_work_order_id uuid,
  p_status text
) returns property_work_orders
language plpgsql
security invoker
as $$
declare v property_work_orders;
begin
  if p_status not in ('draft','requested','quoted','approved','scheduled','in_progress','completed','cancelled') then
    raise exception 'Invalid work order status';
  end if;

  update property_work_orders w
  set status=p_status,
      requested_at=case when p_status='requested' and w.requested_at is null then now() else w.requested_at end,
      scheduled_at=case when p_status='scheduled' and w.scheduled_at is null then now() else w.scheduled_at end,
      completed_at=case when p_status='completed' then coalesce(w.completed_at,now()) else w.completed_at end,
      updated_at=now()
  from property_records r
  where w.id=p_work_order_id
    and r.id=w.property_record_id
    and r.developer_id is not null
    and developer_role(r.developer_id) in ('owner','admin','manager')
  returning w.* into v;

  if v.id is null then
    raise exception 'Work order not found or not authorized';
  end if;

  return v;
end;
$$;

create or replace function property_set_assignment_status(
  p_assignment_id uuid,
  p_status text
) returns property_work_order_assignments
language plpgsql
security invoker
as $$
declare v property_work_order_assignments;
begin
  if p_status not in ('proposed','accepted','declined','scheduled','in_progress','completed','cancelled') then
    raise exception 'Invalid assignment status';
  end if;

  update property_work_order_assignments a
  set status=p_status,
      scheduled_at=case when p_status='scheduled' and a.scheduled_at is null then now() else a.scheduled_at end,
      completed_at=case when p_status='completed' then coalesce(a.completed_at,now()) else a.completed_at end,
      updated_at=now()
  from property_work_orders w
  join property_records r on r.id=w.property_record_id
  where a.id=p_assignment_id
    and w.id=a.work_order_id
    and r.developer_id is not null
    and developer_role(r.developer_id) in ('owner','admin','manager')
    and exists (
      select 1
      from property_service_providers p
      where p.id=a.provider_id
        and (p.developer_id is null or p.developer_id=r.developer_id)
    )
  returning a.* into v;

  if v.id is null then
    raise exception 'Assignment not found or not authorized';
  end if;

  return v;
end;
$$;

revoke all on function property_set_work_order_status(uuid,text) from public;
revoke all on function property_set_work_order_status(uuid,text) from anon;
grant execute on function property_set_work_order_status(uuid,text) to authenticated;

revoke all on function property_set_assignment_status(uuid,text) from public;
revoke all on function property_set_assignment_status(uuid,text) from anon;
grant execute on function property_set_assignment_status(uuid,text) to authenticated;

drop policy if exists property_providers_developer_manage on property_service_providers;
create policy property_providers_developer_manage on property_service_providers
for all to authenticated
using (
  developer_id is not null
  and developer_role(developer_id) in ('owner','admin','manager')
)
with check (
  developer_id is not null
  and developer_role(developer_id) in ('owner','admin','manager')
);

drop policy if exists property_providers_developer_read on property_service_providers;
create policy property_providers_developer_read on property_service_providers
for select to authenticated
using (
  (developer_id is not null and developer_role(developer_id) in ('owner','admin','manager'))
  or exists (
    select 1
    from property_work_order_assignments a
    where a.provider_id=property_service_providers.id
      and exists (
        select 1
        from property_work_orders w
        join property_records r on r.id=w.property_record_id
        where w.id=a.work_order_id
          and r.developer_id is not null
          and developer_role(r.developer_id) in ('owner','admin','manager')
          and (property_service_providers.developer_id is null or property_service_providers.developer_id=r.developer_id)
      )
  )
);
