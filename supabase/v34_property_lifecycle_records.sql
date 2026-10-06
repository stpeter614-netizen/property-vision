-- Property Vision V34
-- First-class property and lifecycle records.
-- Preserves the existing project/unit/configuration model while adding
-- a common record for existing property, new development and lifecycle work.

create table if not exists property_records (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid references developers(id) on delete set null,
  project_id uuid references property_projects(id) on delete set null,
  name text not null,
  property_type text not null check (property_type in (
    'house','apartment','villa','bungalow','townhouse',
    'commercial','office','retail','industrial','land','other'
  )),
  lifecycle_stage text not null check (lifecycle_stage in (
    'concept','design','planning','construction','sale','rent',
    'purchase','configuration','renovation','repair','maintenance',
    'upgrade','handover','resale'
  )),
  address text,
  description text,
  status text not null default 'active' check (status in ('draft','active','archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists property_records_developer_idx
  on property_records(developer_id, created_at desc);
create index if not exists property_records_project_idx
  on property_records(project_id, created_at desc);
create index if not exists property_records_lifecycle_idx
  on property_records(lifecycle_stage, property_type);

alter table property_records enable row level security;

drop policy if exists property_records_public_read on property_records;
create policy property_records_public_read
on property_records for select
to anon, authenticated
using (status = 'active');

drop policy if exists property_records_developer_manage on property_records;
create policy property_records_developer_manage
on property_records for all
to authenticated
using (
  developer_id is not null
  and developer_role(developer_id) in ('owner','admin','manager')
)
with check (
  developer_id is not null
  and developer_role(developer_id) in ('owner','admin','manager')
);

create or replace function touch_property_record()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists property_records_touch on property_records;
create trigger property_records_touch
before update on property_records
for each row execute function touch_property_record();
