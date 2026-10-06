-- Property Vision V41
-- Close the remaining public read path on developer-owned property records.
-- Unowned active records remain publicly readable; developer-owned records
-- are visible only to members of the owning developer tenant.

drop policy if exists property_records_public_read on property_records;

create policy property_records_public_read
on property_records for select
to anon, authenticated
using (
  status = 'active'
  and (
    developer_id is null
    or is_developer_member(developer_id)
  )
);
