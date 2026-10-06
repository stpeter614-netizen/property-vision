-- Property Vision V40
-- Close remaining provider/assignment cross-tenant access paths.

drop policy if exists property_providers_developer_read on property_service_providers;
create policy property_providers_developer_read on property_service_providers
for select to authenticated
using (
  (
    developer_id is not null
    and developer_role(developer_id) in ('owner','admin','manager')
  )
  or exists (
    select 1
    from property_work_order_assignments a
    join property_work_orders w on w.id=a.work_order_id
    join property_records r on r.id=w.property_record_id
    where a.provider_id=property_service_providers.id
      and r.developer_id is not null
      and developer_role(r.developer_id) in ('owner','admin','manager')
      and (property_service_providers.developer_id is null
           or property_service_providers.developer_id=r.developer_id)
  )
);

drop policy if exists property_assignments_developer_manage on property_work_order_assignments;
create policy property_assignments_developer_manage on property_work_order_assignments
for all to authenticated
using (
  exists (
    select 1
    from property_work_orders w
    join property_records r on r.id=w.property_record_id
    where w.id=property_work_order_assignments.work_order_id
      and r.developer_id is not null
      and developer_role(r.developer_id) in ('owner','admin','manager')
  )
)
with check (
  exists (
    select 1
    from property_work_orders w
    join property_records r on r.id=w.property_record_id
    join property_service_providers p on p.id=property_work_order_assignments.provider_id
    where w.id=property_work_order_assignments.work_order_id
      and r.developer_id is not null
      and developer_role(r.developer_id) in ('owner','admin','manager')
      and (p.developer_id is null or p.developer_id=r.developer_id)
  )
);
