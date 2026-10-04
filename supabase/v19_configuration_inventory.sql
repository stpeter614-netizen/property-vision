-- Property Vision V19
-- Configuration persistence + inventory/reservation reporting.

create table if not exists property_configurations (
 id text primary key,
 unit_id uuid not null references units(id),
 base_price_cents bigint not null,
 final_price_cents bigint not null,
 options jsonb not null default '[]'::jsonb,
 status text not null default 'saved',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

alter table property_reservations add column if not exists configuration_id_text text;

create or replace function save_property_configuration(
 p_unit_id uuid,p_configuration_id text,p_base_price numeric,p_options jsonb,p_final_price numeric
) returns jsonb language plpgsql security definer as $$
begin
 insert into property_configurations(id,unit_id,base_price_cents,final_price_cents,options)
 values(p_configuration_id,p_unit_id,round(p_base_price*100),round(p_final_price*100),p_options)
 on conflict(id) do update set options=excluded.options,final_price_cents=excluded.final_price_cents,updated_at=now();
 return jsonb_build_object('configuration_id',p_configuration_id,'unit_id',p_unit_id,'final_price',p_final_price,'status','saved');
end $$;

create or replace view property_vision_reservation_report as
select r.id reservation_id,r.unit_id,r.configuration_id,r.status,r.expires_at,r.stripe_session_id,r.amount_received_cents,r.created_at,c.final_price_cents,c.options
from property_reservations r left join property_configurations c on c.id=r.configuration_id;

create or replace view property_vision_inventory as
select status,count(*) unit_count from units group by status;