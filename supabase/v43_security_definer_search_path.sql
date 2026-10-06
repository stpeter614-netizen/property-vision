-- Property Vision V43
-- Harden legacy SECURITY DEFINER functions against search_path manipulation.

create or replace function save_property_configuration(
 p_unit_id uuid,p_configuration_id text,p_base_price numeric,p_options jsonb,p_final_price numeric
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
 insert into property_configurations(id,unit_id,base_price_cents,final_price_cents,options)
 values(p_configuration_id,p_unit_id,round(p_base_price*100),round(p_final_price*100),p_options)
 on conflict(id) do update set options=excluded.options,final_price_cents=excluded.final_price_cents,updated_at=now();
 return jsonb_build_object('configuration_id',p_configuration_id,'unit_id',p_unit_id,'final_price',p_final_price,'status','saved');
end $$;

create or replace function confirm_property_payment(
 p_reservation_id uuid,p_stripe_session_id text,p_amount_received bigint
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare r property_reservations;
begin
 select * into r from property_reservations where id=p_reservation_id for update;
 if not found then raise exception 'RESERVATION_NOT_FOUND'; end if;
 if r.status='paid' then return jsonb_build_object('reservation_id',r.id,'status','paid','idempotent',true); end if;
 if r.expires_at < now() and r.status='pending_payment' then
  update property_reservations set status='expired',payment_status='expired',updated_at=now() where id=r.id;
  update units set status='available' where id=r.unit_id and status='reserved';
  raise exception 'RESERVATION_EXPIRED';
 end if;
 update property_reservations set status='paid',payment_status='paid',stripe_session_id=p_stripe_session_id,amount_received_cents=p_amount_received,updated_at=now() where id=r.id;
 update units set status='sold' where id=r.unit_id and status='reserved';
 return jsonb_build_object('reservation_id',r.id,'status','paid','payment_status','paid','unit_status','sold','idempotent',false);
end $$;

create or replace function expire_property_reservations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare n integer;
begin
 update units u set status='available' from property_reservations r where r.unit_id=u.id and r.status='pending_payment' and r.expires_at < now() and u.status='reserved';
 update property_reservations set status='expired',payment_status='expired',updated_at=now() where status='pending_payment' and expires_at < now();
 get diagnostics n = row_count; return n;
end $$;

create or replace function create_property_project(
 p_name text,p_location text,p_floors integer,p_units_per_floor integer,p_bedrooms integer,p_starting_price numeric
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare pid uuid;
begin
 insert into property_projects(name,location,floors,units_per_floor,bedrooms,starting_price_cents)
 values(p_name,p_location,p_floors,p_units_per_floor,p_bedrooms,round(p_starting_price*100)) returning id into pid;
 insert into property_units(project_id,unit_number,floor_number,bedrooms,base_price_cents)
 select pid,(f::text)||((u)::text),f,p_bedrooms,round(p_starting_price*100)
 from generate_series(1,p_floors) f,generate_series(1,p_units_per_floor) u;
 return jsonb_build_object('project_id',pid,'units_created',p_floors*p_units_per_floor);
end $$;

-- These membership helpers are intentionally callable by RLS policies.
create or replace function is_developer_member(p_developer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
 select exists(select 1 from developer_members where developer_id=p_developer_id and user_id=auth.uid());
$$;

create or replace function developer_role(p_developer_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
 select role from developer_members where developer_id=p_developer_id and user_id=auth.uid() limit 1;
$$;
