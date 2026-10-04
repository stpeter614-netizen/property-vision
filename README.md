# Property Vision V40

V40 adds developer-side control of the buyer post-reservation journey.

## Added
- Developer milestone management endpoint and dashboard
- Developer checklist management endpoint and dashboard
- Milestone status controls: upcoming / in progress / completed
- Checklist status controls: pending / submitted / approved / rejected / completed
- Developer notes/reviewer fields and completion timestamps
- Checklist assignment support via assigned_to
- Developer RLS policies for milestones and checklist items
- Developer progress page: `/developer/property-progress`
- Developer dashboard link to Buyer Progress

## Preserved
V31-V39 functionality remains in the package.

## V41 — activity history + notifications
- Added `property_activity_log` for milestone/checklist status history and actor/time tracking.
- Added `property_notifications` for buyer in-app property-progress notifications.
- Added buyer notifications API at `/api/notifications`.
- Added developer activity API/page at `/api/developer/activity` and `/developer/activity`.
- Developer progress status changes now attempt to create an activity record and notify the reserved buyer for checklist changes.
- External email/SMS/WhatsApp delivery is intentionally not claimed as part of V41; these records provide the in-app/event foundation.

## V42 — Unified Reservation Timeline
- Reservation lifecycle events now feed the unified property activity log.
- Buyer and developer notifications are generated from reservation events.
- Buyer property progress now includes a chronological journey timeline.
- Corrected buyer activity/checklist RLS references to use `property_reservations`.
- External email/SMS/WhatsApp delivery remains separate from the in-app notification record layer.

## V43 — Notification Delivery Outbox
- Added `property_notification_deliveries` as a durable per-channel delivery/outbox table.
- Supports email, SMS, WhatsApp and in-app channels with queued/processing/sent/failed/cancelled states.
- Tracks attempts, retry time, provider, provider message ID, errors and timestamps.
- Added internal worker API for queue creation and due-job retrieval.
- External providers are intentionally not hard-wired; this is the delivery architecture, not a claim that messages are already being sent.

## V44 — Notification Enqueue + Worker Processing
- New database trigger automatically creates an in-app delivery record whenever a `property_notifications` row is created.
- Email delivery jobs are automatically queued when the notification recipient has an email address.
- Added `/api/notification-worker` for authenticated worker processing.
- Worker claims queued/due jobs, records attempts, marks internal in-app delivery sent, and applies retry timing for unconfigured external providers.
- External email/SMS/WhatsApp providers remain behind an explicit adapter boundary; V44 does not falsely claim that messages are being sent through a live provider.
- Delivery records remain idempotent through the existing `(notification_id, channel)` uniqueness rule.

## V45 — Provider Adapter Layer
- Added provider adapters for real email, SMS and WhatsApp delivery.
- Email uses Resend when `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are configured.
- SMS/WhatsApp use Twilio when the corresponding credentials/from address are configured.
- Worker now loads the notification title/message and calls the correct provider adapter.
- Provider message IDs are persisted on successful delivery.
- Missing credentials remain a controlled retryable failure; no provider is assumed active.
- No credentials are stored in source code.

## V46 — Automatic Worker Scheduling + Delivery Monitoring
- Added `vercel.json` cron configuration to invoke `/api/notification-worker` every 5 minutes.
- Worker accepts either the existing `NOTIFICATION_WORKER_SECRET` header or Vercel Cron's `CRON_SECRET` bearer authorization.
- Existing claim/idempotency protection remains in place so overlapping runs do not double-send a delivery.
- Added delivery monitoring endpoint at `/api/developer/notification-deliveries` for authenticated internal/server use.
- Added developer delivery monitor at `/developer/notification-deliveries` with queued, processing, sent, failed and cancelled counts plus recent failures.
- External delivery still only occurs when the corresponding provider credentials are configured.

## V49 — Production Activation Package
- Verified the connected Supabase project before activation: Property Vision notification tables were not yet present; `pg_cron` is installed; `pg_net` is not installed; no Property Vision notification cron job exists.
- Added a production activation migration that creates the notification delivery outbox, RLS, indexes and durable enqueue trigger.
- Added read-only preflight and post-deployment verification SQL.
- Added narrow V49 rollback SQL.
- Added server-side environment manifest.
- Added an optional, commented Supabase Cron/pg_net example; it is not enabled automatically.
- Fixed the worker to accept Vercel Cron GET requests as well as authenticated POST requests.
- Removed the unsafe `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` fallback from the notification worker/delivery routes; the service-role key is now server-only via `SUPABASE_SERVICE_ROLE_KEY`.
- V49 also removes the `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` fallback from the Property Vision server API surface so the privileged key is not intentionally exposed as a browser environment variable.

## V50 — controlled cutover verification
V50 adds read-only cutover gates, post-activation queue metrics, a non-destructive smoke test, and an explicit production runbook. It does not activate the live database or external providers.
See `README_V50.md` and `V50_CUTOVER_RUNBOOK.md`.
