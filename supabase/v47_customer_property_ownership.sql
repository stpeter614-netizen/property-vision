-- Property Vision V47
-- Customer-owned property lifecycle records and work requests.
-- Keeps developer tenant controls intact while giving authenticated property
-- owners a secure first-party creation path.

alter table property_records
  add column if not exists owner_user_id uuid references auth.users(id) on delete set null;

create index if not exists property_records_owner_idx
  on property_records(owner_user_id, created_at desc);

drop policy if exists property_records_owner_read on property_records;
create policy property_records_owner_read on property_records for select to authenticated
using (owner_user_id = auth.uid());

drop policy if exists property_records_owner_insert on property_records;
create policy property_records_owner_insert on property_records for insert to authenticated
with check (owner_user_id = auth.uid() and developer_id is null);

drop policy if exists property_records_owner_update on property_records;
create policy property_records_owner_update on property_records for update to authenticated
using (owner_user_id = auth.uid() and developer_id is null)
with check (owner_user_id = auth.uid() and developer_id is null);

drop policy if exists property_records_owner_delete on property_records;
create policy property_records_owner_delete on property_records for delete to authenticated
using (owner_user_id = auth.uid() and developer_id is null);

drop policy if exists property_work_orders_owner_read on property_work_orders;
create policy property_work_orders_owner_read on property_work_orders for select to authenticated
using (exists (select 1 from property_records r where r.id=property_work_orders.property_record_id and r.owner_user_id=auth.uid() and r.developer_id is null));

drop policy if exists property_work_orders_owner_insert on property_work_orders;
create policy property_work_orders_owner_insert on property_work_orders for insert to authenticated
with check (exists (select 1 from property_records r where r.id=property_work_orders.property_record_id and r.owner_user_id=auth.uid() and r.developer_id is null));

drop policy if exists property_work_orders_owner_update on property_work_orders;
create policy property_work_orders_owner_update on property_work_orders for update to authenticated
using (exists (select 1 from property_records r where r.id=property_work_orders.property_record_id and r.owner_user_id=auth.uid() and r.developer_id is null))
with check (exists (select 1 from property_records r where r.id=property_work_orders.property_record_id and r.owner_user_id=auth.uid() and r.developer_id is null));

drop policy if exists property_work_items_owner_read on property_work_items;
create policy property_work_items_owner_read on property_work_items for select to authenticated
using (exists (select 1 from property_work_orders w join property_records r on r.id=w.property_record_id where w.id=property_work_items.work_order_id and r.owner_user_id=auth.uid() and r.developer_id is null));

drop policy if exists property_work_items_owner_insert on property_work_items;
create policy property_work_items_owner_insert on property_work_items for insert to authenticated
with check (exists (select 1 from property_work_orders w join property_records r on r.id=w.property_record_id where w.id=property_work_items.work_order_id and r.owner_user_id=auth.uid() and r.developer_id is null));


-- Property Vision V52: allow a customer to remove only their own unclaimed
-- requested work order when a scope-item insert needs to be rolled back.
drop policy if exists property_work_orders_customer_delete on property_work_orders;
create policy property_work_orders_customer_delete on property_work_orders
for delete to authenticated
using (
  status = 'requested'
  and developer_id is null
  and exists (
    select 1 from property_records r
    where r.id = property_work_orders.property_record_id
      and r.owner_user_id = auth.uid()
  )
);
