-- Property Vision V35
-- Lifecycle work orders for renovation, repair, maintenance and upgrades.

create table if not exists property_work_orders (
  id uuid primary key default gen_random_uuid(),
  property_record_id uuid not null references property_records(id) on delete cascade,
  service_id uuid references property_services(id) on delete set null,
  title text not null,
  work_type text not null check (work_type in (
    'renovation','repair','maintenance','upgrade','inspection','installation','other'
  )),
  urgency text not null default 'normal' check (urgency in ('routine','normal','urgent','emergency')),
  description text,
  location text,
  budget_cents bigint,
  status text not null default 'draft' check (status in (
    'draft','requested','quoted','approved','scheduled','in_progress',
    'completed','cancelled'
  )),
  requested_at timestamptz,
  scheduled_at timestamptz,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists property_work_items (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references property_work_orders(id) on delete cascade,
  description text not null,
  quantity numeric,
  unit text,
  estimated_cost_cents bigint,
  actual_cost_cents bigint,
  status text not null default 'planned' check (status in ('planned','approved','in_progress','completed','cancelled')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists property_work_orders_property_idx
  on property_work_orders(property_record_id, created_at desc);
create index if not exists property_work_orders_status_idx
  on property_work_orders(status, urgency);
create index if not exists property_work_items_order_idx
  on property_work_items(work_order_id);

alter table property_work_orders enable row level security;
alter table property_work_items enable row level security;

drop policy if exists property_work_orders_public_read on property_work_orders;
create policy property_work_orders_public_read
on property_work_orders for select
to authenticated
using (
  exists (
    select 1 from property_records r
    where r.id = property_work_orders.property_record_id
      and r.status = 'active'
      and (
        r.developer_id is null
        or developer_role(r.developer_id) in ('owner','admin','manager')
      )
  )
);

drop policy if exists property_work_orders_developer_manage on property_work_orders;
create policy property_work_orders_developer_manage
on property_work_orders for all
to authenticated
using (
  exists (
    select 1 from property_records r
    where r.id = property_work_orders.property_record_id
      and r.developer_id is not null
      and developer_role(r.developer_id) in ('owner','admin','manager')
  )
)
with check (
  exists (
    select 1 from property_records r
    where r.id = property_work_orders.property_record_id
      and r.developer_id is not null
      and developer_role(r.developer_id) in ('owner','admin','manager')
  )
);

drop policy if exists property_work_items_developer_manage on property_work_items;
create policy property_work_items_developer_manage
on property_work_items for all
to authenticated
using (
  exists (
    select 1
    from property_work_orders w
    join property_records r on r.id = w.property_record_id
    where w.id = property_work_items.work_order_id
      and r.developer_id is not null
      and developer_role(r.developer_id) in ('owner','admin','manager')
  )
)
with check (
  exists (
    select 1
    from property_work_orders w
    join property_records r on r.id = w.property_record_id
    where w.id = property_work_items.work_order_id
      and r.developer_id is not null
      and developer_role(r.developer_id) in ('owner','admin','manager')
  )
);

create or replace function touch_property_work_order()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists property_work_orders_touch on property_work_orders;
create trigger property_work_orders_touch
before update on property_work_orders
for each row execute function touch_property_work_order();
