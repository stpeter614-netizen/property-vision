-- Property Vision V20
alter table if exists units enable row level security;
alter table if exists property_configurations enable row level security;
alter table if exists property_reservations enable row level security;

create table if not exists developer_members (
 developer_id uuid not null,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null default 'viewer',
 created_at timestamptz not null default now(),
 primary key(developer_id,user_id)
);
alter table developer_members enable row level security;
create policy if not exists "members_read_self" on developer_members for select to authenticated using (user_id=auth.uid());
create index if not exists units_status_idx on units(status);
create index if not exists reservations_unit_status_idx on property_reservations(unit_id,status);
create or replace view property_vision_inventory_summary as
select count(*) filter(where status='available') available,count(*) filter(where status='reserved') reserved,count(*) filter(where status='sold') sold,count(*) filter(where status='off_market') off_market,count(*) total from units;