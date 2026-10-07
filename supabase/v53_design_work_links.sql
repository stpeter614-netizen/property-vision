-- Property Vision V53
-- Connect an approved design render to the actual work request it will inform.

create table if not exists property_work_order_design_links (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references property_work_orders(id) on delete cascade,
  design_brief_id uuid not null references property_design_briefs(id) on delete cascade,
  render_request_id uuid not null references property_render_requests(id) on delete cascade,
  linked_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(work_order_id, render_request_id)
);

create index if not exists property_work_order_design_links_work_order_idx
  on property_work_order_design_links(work_order_id, created_at desc);

create index if not exists property_work_order_design_links_render_idx
  on property_work_order_design_links(render_request_id, created_at desc);

alter table property_work_order_design_links enable row level security;

drop policy if exists property_work_order_design_links_customer_read on property_work_order_design_links;
create policy property_work_order_design_links_customer_read
on property_work_order_design_links for select to authenticated
using (
  exists (
    select 1
    from property_work_orders w
    join property_records r on r.id = w.property_record_id
    where w.id = property_work_order_design_links.work_order_id
      and r.owner_user_id = auth.uid()
  )
);

drop policy if exists property_work_order_design_links_customer_insert on property_work_order_design_links;
create policy property_work_order_design_links_customer_insert
on property_work_order_design_links for insert to authenticated
with check (
  linked_by = auth.uid()
  and exists (
    select 1
    from property_work_orders w
    join property_records r on r.id = w.property_record_id
    where w.id = property_work_order_design_links.work_order_id
      and r.owner_user_id = auth.uid()
  )
  and exists (
    select 1
    from property_render_requests rr
    join property_records r on r.id = rr.property_record_id
    where rr.id = property_work_order_design_links.render_request_id
      and rr.status = 'approved'
      and r.owner_user_id = auth.uid()
  )
);

drop policy if exists property_work_order_design_links_developer_read on property_work_order_design_links;
create policy property_work_order_design_links_developer_read
on property_work_order_design_links for select to authenticated
using (
  exists (
    select 1
    from property_work_orders w
    where w.id = property_work_order_design_links.work_order_id
      and w.developer_id is not null
      and developer_role(w.developer_id) in ('owner','admin','manager')
  )
);
