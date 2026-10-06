-- Property Vision V38
-- Unified lifecycle execution state for work orders.

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

  update property_work_orders
  set status=p_status,
      scheduled_at=case when p_status='scheduled' and scheduled_at is null then now() else scheduled_at end,
      completed_at=case when p_status='completed' then coalesce(completed_at,now()) else completed_at end,
      updated_at=now()
  where id=p_work_order_id
  returning * into v;

  if v.id is null then raise exception 'Work order not found'; end if;
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

  update property_work_order_assignments
  set status=p_status,
      scheduled_at=case when p_status='scheduled' and scheduled_at is null then now() else scheduled_at end,
      completed_at=case when p_status='completed' then coalesce(completed_at,now()) else completed_at end,
      updated_at=now()
  where id=p_assignment_id
  returning * into v;

  if v.id is null then raise exception 'Assignment not found'; end if;
  return v;
end;
$$;

create or replace view property_work_execution_overview
with (security_invoker=true) as
select
  w.id as work_order_id,
  w.property_record_id,
  w.title,
  w.work_type,
  w.urgency,
  w.status as work_status,
  e.id as estimate_id,
  e.status as estimate_status,
  e.total_cents as estimate_total_cents,
  a.id as assignment_id,
  a.status as assignment_status,
  p.id as provider_id,
  p.name as provider_name,
  p.provider_type,
  p.specialties
from property_work_orders w
left join lateral (
  select e1.* from property_estimates e1
  where e1.work_order_id=w.id
  order by e1.created_at desc limit 1
) e on true
left join lateral (
  select a1.* from property_work_order_assignments a1
  where a1.work_order_id=w.id
  order by a1.created_at desc limit 1
) a on true
left join property_service_providers p on p.id=a.provider_id;

grant execute on function property_set_work_order_status(uuid,text) to authenticated;
grant execute on function property_set_assignment_status(uuid,text) to authenticated;
