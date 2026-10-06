-- Property Vision V48
-- Close public visibility of authenticated customer-owned property records.
-- Only explicitly unowned active records remain public.

drop policy if exists property_records_public_read on property_records;
create policy property_records_public_read
on property_records for select
to anon, authenticated
using (
  status = 'active'
  and owner_user_id is null
  and (
    developer_id is null
    or is_developer_member(developer_id)
  )
);
