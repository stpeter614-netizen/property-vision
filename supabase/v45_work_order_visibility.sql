-- Property Vision V45
-- Restrict lifecycle work-order data to authorized developer roles.
-- Work orders contain operational scope, location and budget information and
-- must not be readable by arbitrary authenticated users.

drop policy if exists property_work_orders_public_read on property_work_orders;
