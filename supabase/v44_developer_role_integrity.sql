-- Property Vision V44
-- Lock developer membership roles to the authorization vocabulary used by RLS policies.
-- Existing rows are not rewritten; NOT VALID allows deployment to proceed safely
-- while enforcing the constraint for all future inserts/updates.

alter table if exists developer_members
  drop constraint if exists developer_members_role_check;

alter table if exists developer_members
  add constraint developer_members_role_check
  check (role in ('owner','admin','manager','viewer'))
  not valid;
