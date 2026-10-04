-- Property Vision V22
alter table if exists property_reservations add column if not exists payment_status text not null default 'unpaid';
create index if not exists reservation_payment_status_idx on property_reservations(payment_status);
create or replace function confirm_property_payment(p_reservation_id uuid,p_stripe_session_id text,p_amount_received bigint) returns jsonb language plpgsql security definer as $$
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
create or replace function expire_property_reservations() returns integer language plpgsql security definer as $$
declare n integer;
begin
 update units u set status='available' from property_reservations r where r.unit_id=u.id and r.status='pending_payment' and r.expires_at < now() and u.status='reserved';
 update property_reservations set status='expired',payment_status='expired',updated_at=now() where status='pending_payment' and expires_at < now();
 get diagnostics n = row_count; return n;
end $$;