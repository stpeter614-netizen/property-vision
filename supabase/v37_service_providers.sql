-- Property Vision V37
-- Provider and contractor execution foundation.

create table if not exists property_service_providers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  provider_type text not null default 'contractor'
    check (provider_type in ('contractor','vendor','professional','specialist')),
  phone text,
  email text,
  specialties text[] not null default '{}',
  service_area text,
  status text not null default 'active'
    check (status in ('active','inactive','pending','suspended')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists property_work_order_assignments (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references property_work_orders(id) on delete cascade,
  provider_id uuid not null references property_service_providers(id) on delete restrict,
  role text not null default 'primary',
  status text not null default 'proposed'
    check (status in ('proposed','accepted','declined','scheduled','in_progress','completed','cancelled')),
  agreed_cost_cents bigint,
  scheduled_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(work_order_id, provider_id)
);

create index if not exists property_provider_status_idx
 on property_service_providers(status);
create index if not exists property_provider_specialties_idx
 on property_service_providers using gin(specialties);
create index if not exists property_assignment_work_order_idx
 on property_work_order_assignments(work_order_id,status);

alter table property_service_providers enable row level security;
alter table property_work_order_assignments enable row level security;

drop policy if exists property_providers_developer_read on property_service_providers;
create policy property_providers_developer_read on property_service_providers
for select to authenticated using (
  status='active'
  or exists (
    select 1
    from property_work_order_assignments a
    join property_work_orders w on w.id=a.work_order_id
    join property_records r on r.id=w.property_record_id
    where a.provider_id=property_service_providers.id
      and r.developer_id is not null
      and developer_role(r.developer_id) in ('owner','admin','manager')
  )
);

drop policy if exists property_providers_developer_manage on property_service_providers;
create policy property_providers_developer_manage on property_service_providers
for all to authenticated
using (
  exists (
    select 1
    from property_work_order_assignments a
    join property_work_orders w on w.id=a.work_order_id
    join property_records r on r.id=w.property_record_id
    where a.provider_id=property_service_providers.id
      and r.developer_id is not null
      and developer_role(r.developer_id) in ('owner','admin','manager')
  )
)
with check (true);

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
    where w.id=property_work_order_assignments.work_order_id
      and r.developer_id is not null
      and developer_role(r.developer_id) in ('owner','admin','manager')
  )
);
