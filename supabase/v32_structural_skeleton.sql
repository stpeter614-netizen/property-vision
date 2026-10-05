-- Property Vision V32
-- Structural skeleton layer for off-plan, house design and lifecycle visualization.
-- This stores the engineer/architect-supplied structural model; it does not certify structural engineering.

create table if not exists property_structures (
  id uuid primary key default gen_random_uuid(),
  project_id uuid,
  unit_id uuid,
  name text not null,
  structure_type text not null check (structure_type in (
    'foundation','column','beam','slab','wall','stair','roof','opening','other'
  )),
  level_name text,
  geometry jsonb not null default '{}'::jsonb,
  material text,
  source_asset_id uuid,
  engineering_status text not null default 'reference'
    check (engineering_status in ('reference','reviewed','approved')),
  created_at timestamptz not null default now()
);

create index if not exists property_structures_project_idx
  on property_structures(project_id);
create index if not exists property_structures_unit_idx
  on property_structures(unit_id);
create index if not exists property_structures_type_idx
  on property_structures(structure_type);

alter table property_structures enable row level security;
