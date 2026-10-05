-- Property Vision V26
-- Persistent buyer enquiry / developer lead foundation.
-- No public insert policy: the server API uses the Supabase service role after validation.

create table if not exists property_enquiries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid,
  unit_id uuid,
  configuration_id text references property_configurations(id) on delete set null,
  buyer_name text not null,
  buyer_contact text not null,
  message text,
  status text not null default 'new'
    check(status in ('new','contacted','qualified','reserved','closed','lost')),
  source text not null default 'property-vision',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists property_enquiries_project_idx on property_enquiries(project_id);
create index if not exists property_enquiries_unit_idx on property_enquiries(unit_id);
create index if not exists property_enquiries_configuration_idx on property_enquiries(configuration_id);
create index if not exists property_enquiries_status_idx on property_enquiries(status);
create index if not exists property_enquiries_created_idx on property_enquiries(created_at desc);

alter table property_enquiries enable row level security;

create or replace function update_property_enquiry_status(
  p_enquiry_id uuid,
  p_status text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $
begin
  if p_status not in ('new','contacted','qualified','reserved','closed','lost') then
    raise exception 'invalid_status';
  end if;

  update property_enquiries
  set status = p_status, updated_at = now()
  where id = p_enquiry_id;

  if not found then
    raise exception 'enquiry_not_found';
  end if;

  return jsonb_build_object('id', p_enquiry_id, 'status', p_status);
end $$;


revoke all on function update_property_enquiry_status(uuid,text) from public;
revoke all on function update_property_enquiry_status(uuid,text) from anon;
revoke all on function update_property_enquiry_status(uuid,text) from authenticated;
