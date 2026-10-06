-- Property Vision V35
-- Property work orders for renovation, repair, maintenance and upgrades.

create table if not exists property_work_orders (
  id uuid primary key default gen_random_uuid(),
  property_record_id uuid not null references property_records(id) on delete cascade,
  service_id uuid references property_services(id) on delete set null,
  title text not null,
  work_type text not null check (work_type in ('renovation','repair','maintenance','upgrade','inspection')),
  description text,
  area text,
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  status text not null default 'draft' check (status in ('draft','requested','quoted','approved','scheduled','in_progress','completed','cancelled')),
  budget_cents bigint,
  estimated_cost_cents bigint,
  approved_cost_cents bigint,
  target_date date,
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
  material text,
  estimated_cost_cents bigint,
  status text not null default 'pending' check (status in ('pending','selected','ordered','installed','completed')),
  created_at timestamptz not null default now()
);

create table if not exists property_work_updates (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references property_work_orders(id) on delete cascade,
  status text not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists property_work_orders_property_idx
  on property_work_orders(property_record_id, created_at desc);
create index if not exists property_work_orders_status_idx
  on property_work_orders(status, priority);
create index if not exists property_work_items_order_idx
  on property_work_items(work_order_id);
create index if not exists property_work_updates_order_idx
  on property_work_updates(work_order_id, created_at desc);

alter table property_work_orders enable row level security;
alter table property_work_items enable row level security;
alter table property_work_updates enable row level security;

drop policy if exists property_work_orders_public_read on property_work_orders;
create policy property_work_orders_public_read on property_work_orders
for select to anon, authenticated
using (
  exists (
    select 1 from property_records r
    where r.id = property_work_orders.property_record_id
      and r.status = 'active'
  )
);

drop policy if exists property_work_items_public_read on property_work_items;
create policy property_work_items_public_read on property_work_items
for select to anon, authenticated
using (
  exists (
    select 1 from property_work_orders w
    join property_records r on r.id = w.property_record_id
    where w.id = property_work_items.work_order_id
      and r.status = 'active'
  )
);

drop policy if exists property_work_updates_public_read on property_work_updates;
create policy property_work_updates_public_read on property_work_updates
for select to anon, authenticated
using (
  exists (
    select 1 from property_work_orders w
    join property_records r on r.id = w.property_record_id
    where w.id = property_work_updates.work_order_id
      and r.status = 'active'
  )
);

create or replace function touch_property_work_order()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists property_work_orders_touch on property_work_orders;
create trigger property_work_orders_touch
before update on property_work_orders
for each row execute function touch_property_work_order();
