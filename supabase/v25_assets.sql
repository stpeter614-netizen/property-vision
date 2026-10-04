-- Property Vision V25
create table if not exists property_assets (
 id uuid primary key default gen_random_uuid(),project_id uuid not null references property_projects(id) on delete cascade,
 name text not null,type text not null check(type in ('render','photo','floor_plan','3d_model','texture','document','video')),
 file_path text not null,mime_type text,metadata jsonb not null default '{}'::jsonb,created_at timestamptz not null default now()
);
create index if not exists property_assets_project_idx on property_assets(project_id);
create index if not exists property_assets_type_idx on property_assets(type);
alter table property_assets enable row level security;
-- Private assets should be served with signed URLs.
-- Recommended folder: property-assets/{developer_id}/{project_id}/{asset_id}/filename