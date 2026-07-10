package commands

import (
	"fmt"

	"github.com/pocketbase/pocketbase"
	"github.com/spf13/cobra"
)

// ImportEventsCommand imports event types, locations, events and subscriptions from sisi__ legacy tables.
func ImportEventsCommand(app *pocketbase.PocketBase) *cobra.Command {
	cmd := &cobra.Command{
		Use:   "import-events",
		Short: "Import event types, locations, events and subscriptions from sisi__ legacy tables",
		RunE: func(cmd *cobra.Command, args []string) error {
			if err := ensureServerStopped(); err != nil {
				return err
			}

			fmt.Println("Starting events import process...")

			fmt.Println("🧹 Clearing existing data...")
			for _, table := range []string{"ut_subscriptions", "ut_events", "ut_locations", "ut_event_types"} {
				app.DB().NewQuery(`DELETE FROM ` + table).Execute()
			}

			// Step 1: event types (with i18n labels)
			fmt.Println("\n📥 Step 1: Importing event types...")
			eventTypesSQL := `
				INSERT OR IGNORE INTO ut_event_types (id, xid, enabled, label_fr, label_de, label_en, legacy_id)
				SELECT
					lower(substr(hex(randomblob(10)), 1, 15)),
					COALESCE(et.xid, ''),
					et.enabled,
					COALESCE(fr.label, ''),
					COALESCE(de.label, ''),
					COALESCE(en_.label, ''),
					et.id
				FROM sisi__event_types et
				LEFT JOIN sisi__event_types_lang fr  ON fr.type_id  = et.id AND fr.lang_id  = 1
				LEFT JOIN sisi__event_types_lang de  ON de.type_id  = et.id AND de.lang_id  = 2
				LEFT JOIN sisi__event_types_lang en_ ON en_.type_id = et.id AND en_.lang_id = 3
			`
			if _, err := app.DB().NewQuery(eventTypesSQL).Execute(); err != nil {
				return fmt.Errorf("import event types failed: %w", err)
			}
			var etCount int64
			if err := app.DB().NewQuery("SELECT COUNT(*) FROM ut_event_types").Row(&etCount); err == nil {
				fmt.Printf("✅ Imported %d event types\n", etCount)
			}

			// Step 2: locations (with i18n labels and city relation)
			fmt.Println("\n📥 Step 2: Importing locations...")
			locationsSQL := `
				INSERT OR IGNORE INTO ut_locations (id, address, enabled, coords, xid, city, label_fr, label_de, label_en, legacy_id, legacy_city_id)
				SELECT
					lower(substr(hex(randomblob(10)), 1, 15)),
					COALESCE(sl.address, ''),
					COALESCE(sl.enabled, 0),
					COALESCE(sl.coords, ''),
					COALESCE(sl.xid, ''),
					COALESCE(uc.id, ''),
					COALESCE(fr.label, ''),
					'',
					'',
					sl.id,
					sl.city_id
				FROM sisi__locations sl
				LEFT JOIN ut_cities uc ON uc.legacy_id = sl.city_id
				LEFT JOIN sisi__locations_lang fr ON fr.location_id = sl.id AND fr.lang_id = 1
			`
			if _, err := app.DB().NewQuery(locationsSQL).Execute(); err != nil {
				return fmt.Errorf("import locations failed: %w", err)
			}
			var locCount int64
			if err := app.DB().NewQuery("SELECT COUNT(*) FROM ut_locations").Row(&locCount); err == nil {
				fmt.Printf("✅ Imported %d locations\n", locCount)
			}

			// Step 3: events (with i18n, location/city relations, denormalized subscription counts)
			fmt.Println("\n📥 Step 3: Importing events...")
			eventsSQL := `
				INSERT OR IGNORE INTO ut_events (
					id, start_date, end_date, subscription_publish_date,
					max_subscriptions, progress, attendees,
					location, city,
					title_fr, title_de, title_en,
					description_fr, description_de, description_en,
					subscription_count, staff_count,
					legacy_id
				)
				SELECT
					lower(substr(hex(randomblob(10)), 1, 15)),
					COALESCE(e.start_date, ''),
					COALESCE(e.end_date, ''),
					COALESCE(e.subscription_publish_date, ''),
					COALESCE(e.max_subscriptions, 0),
					COALESCE(e.progress, ''),
					COALESCE(e.attendees, ''),
					COALESCE(ul.id, ''),
					COALESCE(uc.id, ''),
					COALESCE(fr.title, ''),
					COALESCE(de.title, ''),
					COALESCE(en_.title, ''),
					COALESCE(fr.description, ''),
					COALESCE(de.description, ''),
					COALESCE(en_.description, ''),
					(SELECT COUNT(*) FROM sisi__subscriptions s WHERE s.event_id = e.id AND s.is_event_admin = 0),
					(SELECT COUNT(*) FROM sisi__subscriptions s WHERE s.event_id = e.id AND s.is_event_admin = 1),
					e.id
				FROM sisi__events e
				LEFT JOIN ut_locations ul ON ul.legacy_id = e.location_id
				LEFT JOIN ut_cities uc ON uc.id = ul.city
				LEFT JOIN sisi__events_lang fr  ON fr.event_id  = e.id AND fr.lang_id  = 1
				LEFT JOIN sisi__events_lang de  ON de.event_id  = e.id AND de.lang_id  = 2
				LEFT JOIN sisi__events_lang en_ ON en_.event_id = e.id AND en_.lang_id = 3
			`
			if _, err := app.DB().NewQuery(eventsSQL).Execute(); err != nil {
				return fmt.Errorf("import events failed: %w", err)
			}
			var evCount int64
			if err := app.DB().NewQuery("SELECT COUNT(*) FROM ut_events").Row(&evCount); err == nil {
				fmt.Printf("✅ Imported %d events\n", evCount)
			}

			// Step 4: update event types relation (JSON array of PB type IDs)
			fmt.Println("\n📥 Step 4: Linking event types to events...")
			typesSQL := `
				UPDATE ut_events
				SET types = COALESCE(
					(
						SELECT json_group_array(t.id)
						FROM sisi__event_types_events ete
						JOIN ut_event_types t ON t.legacy_id = ete.type_id
						WHERE ete.event_id = ut_events.legacy_id
					),
					'[]'
				)
			`
			if _, err := app.DB().NewQuery(typesSQL).Execute(); err != nil {
				return fmt.Errorf("link event types failed: %w", err)
			}
			var linkedCount int64
			if err := app.DB().NewQuery("SELECT COUNT(*) FROM ut_events WHERE types != '[]'").Row(&linkedCount); err == nil {
				fmt.Printf("✅ %d events linked to types\n", linkedCount)
			}

			// Step 5: subscriptions
			fmt.Println("\n📥 Step 5: Importing subscriptions...")
			// The capacity trigger would abort the bulk insert on legacy
			// over-booked events — drop it during the import and recreate it
			// afterwards (keep in sync with the trigger migration).
			if _, err := app.DB().NewQuery("DROP TRIGGER IF EXISTS ut_subscriptions_capacity").Execute(); err != nil {
				return fmt.Errorf("drop capacity trigger failed: %w", err)
			}
			// Legacy duplicate accounts (same email) are collapsed into a single
			// survivor by import-users, so subscriptions are mapped through the
			// email instead of the legacy user id: every duplicate's subscription
			// lands on the surviving account. Subscriptions of the same survivor
			// on the same event are merged into one row (any presence/staff flag
			// wins, legacy_user_id keeps the survivor's own id when it is part of
			// the group). The mapping is materialized with an index first — a
			// direct join on lower(email) cannot use any index and takes hours.
			mappingSQL := []string{
				`DROP TABLE IF EXISTS tmp_user_map`,
				`CREATE TABLE tmp_user_map AS
					SELECT h.id AS legacy_id, u.id AS user_id, u.legacy_id AS survivor_legacy_id
					FROM hypercontent__users h
					JOIN (SELECT id, lower(email) AS lemail, legacy_id FROM ut_users) u
						ON u.lemail = lower(h.email)`,
				`CREATE INDEX idx_tmp_user_map_legacy ON tmp_user_map (legacy_id)`,
			}
			for _, q := range mappingSQL {
				if _, err := app.DB().NewQuery(q).Execute(); err != nil {
					return fmt.Errorf("build user mapping failed: %w", err)
				}
			}
			// presence is tri-state in the legacy table (null = not checked
			// yet): presence_checked keeps that information.
			subscriptionsSQL := `
				INSERT OR IGNORE INTO ut_subscriptions (id, "user", event, presence, presence_checked, is_event_admin, legacy_user_id, legacy_event_id)
				SELECT
					lower(substr(hex(randomblob(10)), 1, 15)),
					m.user_id,
					ev.id,
					MAX(CASE s.presence WHEN 1 THEN 1 ELSE 0 END),
					MAX(CASE WHEN s.presence IS NOT NULL THEN 1 ELSE 0 END),
					MAX(CASE s.is_event_admin WHEN 1 THEN 1 ELSE 0 END),
					COALESCE(MAX(CASE WHEN s.user_id = m.survivor_legacy_id THEN s.user_id END), MAX(s.user_id)),
					s.event_id
				FROM sisi__subscriptions s
				JOIN tmp_user_map m ON m.legacy_id = s.user_id
				JOIN ut_events ev ON ev.legacy_id = s.event_id AND ev.legacy_id != 0
				GROUP BY m.user_id, ev.id
			`
			if _, err := app.DB().NewQuery(subscriptionsSQL).Execute(); err != nil {
				return fmt.Errorf("import subscriptions failed: %w", err)
			}
			if _, err := app.DB().NewQuery(`DROP TABLE IF EXISTS tmp_user_map`).Execute(); err != nil {
				return fmt.Errorf("drop user mapping failed: %w", err)
			}
			var subCount int64
			if err := app.DB().NewQuery("SELECT COUNT(*) FROM ut_subscriptions").Row(&subCount); err == nil {
				fmt.Printf("✅ Imported %d subscriptions\n", subCount)
			}

			recreateTriggerSQL := `
				CREATE TRIGGER IF NOT EXISTS ut_subscriptions_capacity
				BEFORE INSERT ON ut_subscriptions
				FOR EACH ROW WHEN NEW.is_event_admin = 0 AND (
					SELECT COUNT(*) FROM ut_subscriptions
					WHERE event = NEW.event AND is_event_admin = 0
				) >= (SELECT max_subscriptions FROM ut_events WHERE id = NEW.event)
				BEGIN
					SELECT RAISE(ABORT, 'No more subscription accepted on this event');
				END
			`
			if _, err := app.DB().NewQuery(recreateTriggerSQL).Execute(); err != nil {
				return fmt.Errorf("recreate capacity trigger failed: %w", err)
			}

			// Step 6: recompute the denormalized counters from the subscriptions
			// actually imported (step 3 counted the raw legacy rows, but step 5
			// drops orphans through its JOINs). A PocketBase hook keeps these
			// counters in sync afterwards.
			fmt.Println("\n📥 Step 6: Recomputing event subscription counters...")
			recountSQL := `
				UPDATE ut_events SET
					subscription_count = (
						SELECT COUNT(*) FROM ut_subscriptions s
						WHERE s.event = ut_events.id AND s.is_event_admin = 0
					),
					staff_count = (
						SELECT COUNT(*) FROM ut_subscriptions s
						WHERE s.event = ut_events.id AND s.is_event_admin = 1
					)
			`
			if _, err := app.DB().NewQuery(recountSQL).Execute(); err != nil {
				return fmt.Errorf("recompute subscription counters failed: %w", err)
			}
			fmt.Println("✅ Subscription counters recomputed")

			fmt.Println("\n🎉 Events import complete!")
			return nil
		},
	}

	return cmd
}
