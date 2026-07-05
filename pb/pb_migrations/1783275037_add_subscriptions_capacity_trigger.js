/// <reference path="../pb_data/types.d.ts" />

// Refuses participant subscriptions on full events at the SQL level.
// Application-level guards race under concurrency (PocketBase runs
// concurrent creates as savepoints on a shared writer connection); a
// trigger is evaluated per statement and is strictly sequential.
//
// NOTE: pb-tools drops and recreates this trigger around the legacy bulk
// import (see import_events.go), which may contain over-booked events.
// Keep both definitions in sync.
migrate(
  (app) => {
    app
      .db()
      .newQuery(
        `CREATE TRIGGER IF NOT EXISTS ut_subscriptions_capacity
        BEFORE INSERT ON ut_subscriptions
        FOR EACH ROW WHEN NEW.is_event_admin = 0 AND (
          SELECT COUNT(*) FROM ut_subscriptions
          WHERE event = NEW.event AND is_event_admin = 0
        ) >= (SELECT max_subscriptions FROM ut_events WHERE id = NEW.event)
        BEGIN
          SELECT RAISE(ABORT, 'No more subscription accepted on this event');
        END`,
      )
      .execute()
  },
  (app) => {
    app
      .db()
      .newQuery('DROP TRIGGER IF EXISTS ut_subscriptions_capacity')
      .execute()
  },
)
