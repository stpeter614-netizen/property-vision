-- Property Vision V21
alter table if exists property_reservations add column if not exists buyer_user_id uuid references auth.users(id);
create index if not exists reservations_buyer_idx on property_reservations(buyer_user_id);
create policy if not exists "buyer_read_own_reservations" on property_reservations for select to authenticated using (buyer_user_id=auth.uid());
alter table if exists property_configurations add column if not exists buyer_user_id uuid references auth.users(id);
create index if not exists configurations_buyer_idx on property_configurations(buyer_user_id);
create policy if not exists "buyer_read_own_configurations" on property_configurations for select to authenticated using (buyer_user_id=auth.uid());