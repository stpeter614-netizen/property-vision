-- Property Vision V49
-- Secure customer work-order intake and developer tenancy.

alter table property_work_orders add column if not exists developer_id uuid references developers(id) on delete set null;
create index if not exists property_work_orders_developer_idx on property_work_orders(developer_id,status,created_at desc);

drop policy if exists property_work_orders_customer_read on property_work_orders;
create policy property_work_orders_customer_read on property_work_orders for select to authenticated using (
  exists (select 1 from property_records r where r.id=property_work_orders.property_record_id and r.owner_user_id=auth.uid())
);

drop policy if exists property_work_orders_intake_read on property_work_orders;
create policy property_work_orders_intake_read on property_work_orders for select to authenticated using (
  developer_id is null and exists (select 1 from developers d where developer_role(d.id) in ('owner','admin','manager'))
);

drop policy if exists property_work_orders_developer_manage on property_work_orders;
create policy property_work_orders_developer_manage on property_work_orders for all to authenticated
using (developer_id is not null and developer_role(developer_id) in ('owner','admin','manager'))
with check (developer_id is not null and developer_role(developer_id) in ('owner','admin','manager'));

create or replace function property_claim_work_order(p_work_order_id uuid)
returns property_work_orders language plpgsql security definer set search_path=public as $$
declare v_developer_id uuid; v property_work_orders;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select dm.developer_id into v_developer_id from developer_members dm
  where dm.user_id=auth.uid() and dm.role in ('owner','admin','manager')
  order by dm.developer_id limit 1;
  if v_developer_id is null then raise exception 'Developer membership required'; end if;
  update property_work_orders set developer_id=v_developer_id,
    status=case when status='draft' then 'requested' else status end,
    requested_at=coalesce(requested_at,now()),updated_at=now()
  where id=p_work_order_id and developer_id is null and status<>'cancelled'
  returning * into v;
  if v.id is null then raise exception 'Work order unavailable or already claimed'; end if;
  return v;
end; $$;
revoke all on function property_claim_work_order(uuid) from public;
revoke all on function property_claim_work_order(uuid) from anon;
grant execute on function property_claim_work_order(uuid) to authenticated;

drop policy if exists property_estimates_developer_manage on property_estimates;
create policy property_estimates_developer_manage on property_estimates for all to authenticated
using (exists (select 1 from property_work_orders w where w.id=property_estimates.work_order_id and w.developer_id is not null and developer_role(w.developer_id) in ('owner','admin','manager')))
with check (exists (select 1 from property_work_orders w where w.id=property_estimates.work_order_id and w.developer_id is not null and developer_role(w.developer_id) in ('owner','admin','manager')));

drop policy if exists property_estimate_lines_developer_manage on property_estimate_lines;
create policy property_estimate_lines_developer_manage on property_estimate_lines for all to authenticated
using (exists (select 1 from property_estimates e join property_work_orders w on w.id=e.work_order_id where e.id=property_estimate_lines.estimate_id and w.developer_id is not null and developer_role(w.developer_id) in ('owner','admin','manager')))
with check (exists (select 1 from property_estimates e join property_work_orders w on w.id=e.work_order_id where e.id=property_estimate_lines.estimate_id and w.developer_id is not null and developer_role(w.developer_id) in ('owner','admin','manager')));

create or replace function property_set_work_order_status(p_work_order_id uuid,p_status text)
returns property_work_orders language plpgsql security invoker as $$
declare v property_work_orders;
begin
 if p_status not in ('draft','requested','quoted','approved','scheduled','in_progress','completed','cancelled') then raise exception 'Invalid work order status'; end if;
 update property_work_orders w set status=p_status,
 requested_at=case when p_status='requested' and w.requested_at is null then now() else w.requested_at end,
 scheduled_at=case when p_status='scheduled' and w.scheduled_at is null then now() else w.scheduled_at end,
 completed_at=case when p_status='completed' then coalesce(w.completed_at,now()) else w.completed_at end,updated_at=now()
 where w.id=p_work_order_id and w.developer_id is not null and developer_role(w.developer_id) in ('owner','admin','manager')
 returning w.* into v;
 if v.id is null then raise exception 'Work order not found or not authorized'; end if; return v;
end; $$;
revoke all on function property_set_work_order_status(uuid,text) from public;
revoke all on function property_set_work_order_status(uuid,text) from anon;
grant execute on function property_set_work_order_status(uuid,text) to authenticated;

drop policy if exists property_assignments_developer_manage on property_work_order_assignments;
create policy property_assignments_developer_manage on property_work_order_assignments for all to authenticated
using (exists (select 1 from property_work_orders w where w.id=property_work_order_assignments.work_order_id and w.developer_id is not null and developer_role(w.developer_id) in ('owner','admin','manager')))
with check (exists (select 1 from property_work_orders w join property_service_providers p on p.id=property_work_order_assignments.provider_id where w.id=property_work_order_assignments.work_order_id and w.developer_id is not null and developer_role(w.developer_id) in ('owner','admin','manager') and (p.developer_id is null or p.developer_id=w.developer_id)));

create or replace function property_set_assignment_status(p_assignment_id uuid,p_status text)
returns property_work_order_assignments language plpgsql security invoker as $$
declare v property_work_order_assignments;
begin
 if p_status not in ('proposed','accepted','declined','scheduled','in_progress','completed','cancelled') then raise exception 'Invalid assignment status'; end if;
 update property_work_order_assignments a set status=p_status,
 scheduled_at=case when p_status='scheduled' and a.scheduled_at is null then now() else a.scheduled_at end,
 completed_at=case when p_status='completed' then coalesce(a.completed_at,now()) else a.completed_at end,updated_at=now()
 from property_work_orders w where a.id=p_assignment_id and w.id=a.work_order_id and w.developer_id is not null and developer_role(w.developer_id) in ('owner','admin','manager')
 and exists (select 1 from property_service_providers p where p.id=a.provider_id and (p.developer_id is null or p.developer_id=w.developer_id))
 returning a.* into v;
 if v.id is null then raise exception 'Assignment not found or not authorized'; end if; return v;
end; $$;
revoke all on function property_set_assignment_status(uuid,text) from public;
revoke all on function property_set_assignment_status(uuid,text) from anon;
grant execute on function property_set_assignment_status(uuid,text) to authenticated;