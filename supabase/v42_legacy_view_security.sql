-- Property Vision V42
-- Harden legacy reporting views so they honor underlying table RLS.

alter view if exists property_vision_reservation_report
  set (security_invoker = true);

alter view if exists property_vision_inventory
  set (security_invoker = true);

alter view if exists property_vision_inventory_summary
  set (security_invoker = true);
