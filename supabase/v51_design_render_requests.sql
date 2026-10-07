-- Property Vision V51
-- Persist customer design briefs and render requests against the owned property.

create table if not exists property_design_briefs (
  id uuid primary key default gen_random_uuid(),
  property_record_id uuid not null references property_records(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  plot_dimensions text,
  bedrooms integer not null default 3,
  bathrooms integer not null default 2,
  floors integer not null default 1,
  house_style text not null default 'Modern',
  garage text,
  kitchen_living_layout text,
  roof_style text,
  finishes text,
  budget_cents bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists property_design_briefs_property_idx
  on property_design_briefs(property_record_id, updated_at desc);

alter table property_design_briefs enable row level security;

drop policy if exists property_design_briefs_owner_read on property_design_briefs;
create policy property_design_briefs_owner_read on property_design_briefs
for select to authenticated
using (owner_user_id = auth.uid());

drop policy if exists property_design_briefs_owner_insert on property_design_briefs;
create policy property_design_briefs_owner_insert on property_design_briefs
for insert to authenticated
with check (
  owner_user_id = auth.uid()
  and exists (
    select 1 from property_records r
    where r.id = property_record_id
      and r.owner_user_id = auth.uid()
      and r.developer_id is null
  )
);

drop policy if exists property_design_briefs_owner_update on property_design_briefs;
create policy property_design_briefs_owner_update on property_design_briefs
for update to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

create table if not exists property_render_requests (
  id uuid primary key default gen_random_uuid(),
  property_record_id uuid not null references property_records(id) on delete cascade,
  design_brief_id uuid not null references property_design_briefs(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  render_type text not null check (render_type in ('exterior','interior','floor_plan','renovation_before_after','materials')),
  prompt text not null,
  status text not null default 'requested' check (status in ('requested','processing','ready','failed')),
  image_url text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists property_render_requests_property_idx
  on property_render_requests(property_record_id, created_at desc);

alter table property_render_requests enable row level security;

drop policy if exists property_render_requests_owner_read on property_render_requests;
create policy property_render_requests_owner_read on property_render_requests
for select to authenticated
using (owner_user_id = auth.uid());

drop policy if exists property_render_requests_owner_insert on property_render_requests;
create policy property_render_requests_owner_insert on property_render_requests
for insert to authenticated
with check (
  owner_user_id = auth.uid()
  and exists (
    select 1 from property_records r
    where r.id = property_record_id
      and r.owner_user_id = auth.uid()
      and r.developer_id is null
  )
);


alter table property_render_requests
  add column if not exists image_path text;

insert into storage.buckets (id, name, public)
values ('property-renders', 'property-renders', false)
on conflict (id) do nothing;

drop policy if exists property_renders_owner_read on storage.objects;
create policy property_renders_owner_read on storage.objects
for select to authenticated
using (
  bucket_id = 'property-renders'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists property_renders_owner_insert on storage.objects;
create policy property_renders_owner_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'property-renders'
  and (storage.foldername(name))[1] = auth.uid()::text
);
