-- Property Vision V36
-- Materials catalogue and estimate lines tied to lifecycle work.

create table if not exists property_materials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  unit text not null,
  reference_price_cents bigint,
  currency text not null default 'KES',
  supplier text,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists property_estimates (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references property_work_orders(id) on delete cascade,
  currency text not null default 'KES',
  subtotal_cents bigint not null default 0,
  labour_cents bigint not null default 0,
  other_cents bigint not null default 0,
  total_cents bigint not null default 0,
  status text not null default 'draft'
    check (status in ('draft','sent','approved','rejected','expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists property_estimate_lines (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references property_estimates(id) on delete cascade,
  material_id uuid references property_materials(id) on delete set null,
  description text not null,
  quantity numeric not null default 1,
  unit text,
  unit_price_cents bigint not null default 0,
  line_total_cents bigint not null default 0,
  line_type text not null default 'material'
    check (line_type in ('material','labour','other')),
  created_at timestamptz not null default now()
);

create index if not exists property_materials_category_idx
  on property_materials(category, name);
create index if not exists property_estimates_work_order_idx
  on property_estimates(work_order_id, created_at desc);
create index if not exists property_estimate_lines_estimate_idx
  on property_estimate_lines(estimate_id);

alter table property_materials enable row level security;
alter table property_estimates enable row level security;
alter table property_estimate_lines enable row level security;

drop policy if exists property_materials_public_read on property_materials;
create policy property_materials_public_read on property_materials
for select to anon, authenticated using (active = true);

drop policy if exists property_estimates_developer_manage on property_estimates;
create policy property_estimates_developer_manage on property_estimates
for all to authenticated
using (
  exists (
    select 1 from property_work_orders w
    join property_records r on r.id=w.property_record_id
    where w.id=property_estimates.work_order_id
      and r.developer_id is not null
      and developer_role(r.developer_id) in ('owner','admin','manager')
  )
)
with check (
  exists (
    select 1 from property_work_orders w
    join property_records r on r.id=w.property_record_id
    where w.id=property_estimates.work_order_id
      and r.developer_id is not null
      and developer_role(r.developer_id) in ('owner','admin','manager')
  )
);

drop policy if exists property_estimate_lines_developer_manage on property_estimate_lines;
create policy property_estimate_lines_developer_manage on property_estimate_lines
for all to authenticated
using (
  exists (
    select 1
    from property_estimates e
    join property_work_orders w on w.id=e.work_order_id
    join property_records r on r.id=w.property_record_id
    where e.id=property_estimate_lines.estimate_id
      and r.developer_id is not null
      and developer_role(r.developer_id) in ('owner','admin','manager')
  )
)
with check (
  exists (
    select 1
    from property_estimates e
    join property_work_orders w on w.id=e.work_order_id
    join property_records r on r.id=w.property_record_id
    where e.id=property_estimate_lines.estimate_id
      and r.developer_id is not null
      and developer_role(r.developer_id) in ('owner','admin','manager')
  )
);
