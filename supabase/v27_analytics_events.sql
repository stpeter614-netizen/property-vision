create table if not exists property_analytics_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid,
  unit_id uuid,
  configuration_id text,
  event_name text not null,
  session_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists property_analytics_events_event_idx on property_analytics_events(event_name,created_at desc);
create index if not exists property_analytics_events_project_idx on property_analytics_events(project_id,created_at desc);
alter table property_analytics_events enable row level security;