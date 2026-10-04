-- Property Vision V23
create table if not exists property_projects (
 id uuid primary key default gen_random_uuid(),name text not null,location text not null,floors integer not null check(floors>0),
 units_per_floor integer not null check(units_per_floor>0),bedrooms integer not null check(bedrooms>0),
 starting_price_cents bigint not null,created_at timestamptz not null default now()
);
create table if not exists property_units (
 id uuid primary key default gen_random_uuid(),project_id uuid not null references property_projects(id) on delete cascade,
 unit_number text not null,floor_number integer not null,bedrooms integer not null,bathrooms integer not null default 2,
 area_m2 numeric not null default 142,base_price_cents bigint not null,status text not null default 'available'
 check(status in ('available','reserved','sold','off_market')),created_at timestamptz not null default now(),
 unique(project_id,unit_number)
);
create index if not exists property_units_project_idx on property_units(project_id);
create index if not exists property_units_status_idx on property_units(status);
create or replace function create_property_project(p_name text,p_location text,p_floors integer,p_units_per_floor integer,p_bedrooms integer,p_starting_price numeric) returns jsonb language plpgsql security definer as $$
declare pid uuid;
begin
 insert into property_projects(name,location,floors,units_per_floor,bedrooms,starting_price_cents)
 values(p_name,p_location,p_floors,p_units_per_floor,p_bedrooms,round(p_starting_price*100)) returning id into pid;
 insert into property_units(project_id,unit_number,floor_number,bedrooms,base_price_cents)
 select pid,(f::text)||((u)::text),f,p_bedrooms,round(p_starting_price*100)
 from generate_series(1,p_floors) f,generate_series(1,p_units_per_floor) u;
 return jsonb_build_object('project_id',pid,'units_created',p_floors*p_units_per_floor);
end $$;