-- Property Vision V50
-- Secure customer estimate response.

alter table property_estimates add column if not exists responded_at timestamptz;
alter table property_estimates add column if not exists responded_by uuid references auth.users(id) on delete set null;

drop policy if exists property_estimates_customer_read on property_estimates;
create policy property_estimates_customer_read on property_estimates for select to authenticated using (
  exists (
    select 1 from property_work_orders w
    join property_records r on r.id=w.property_record_id
    where w.id=property_estimates.work_order_id
      and r.owner_user_id=auth.uid()
  )
);

drop policy if exists property_estimate_lines_customer_read on property_estimate_lines;
create policy property_estimate_lines_customer_read on property_estimate_lines for select to authenticated using (
  exists (
    select 1 from property_estimates e
    join property_work_orders w on w.id=e.work_order_id
    join property_records r on r.id=w.property_record_id
    where e.id=property_estimate_lines.estimate_id
      and r.owner_user_id=auth.uid()
  )
);

create or replace function property_respond_to_estimate(p_estimate_id uuid,p_response text)
returns property_estimates language plpgsql security definer set search_path=public as $$
declare v property_estimates;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_response not in ('approved','rejected') then raise exception 'Invalid estimate response'; end if;

  update property_estimates e
  set status=p_response, responded_at=now(), responded_by=auth.uid(), updated_at=now()
  where e.id=p_estimate_id
    and e.status='sent'
    and exists (
      select 1 from property_work_orders w
      join property_records r on r.id=w.property_record_id
      where w.id=e.work_order_id and r.owner_user_id=auth.uid()
    )
  returning e.* into v;

  if v.id is null then raise exception 'Estimate not found or not available'; end if;

  if p_response='approved' then
    update property_work_orders
    set status='approved', updated_at=now()
    where id=v.work_order_id and status='quoted';
  end if;

  return v;
end; $$;

revoke all on function property_respond_to_estimate(uuid,text) from public;
revoke all on function property_respond_to_estimate(uuid,text) from anon;
grant execute on function property_respond_to_estimate(uuid,text) to authenticated;
