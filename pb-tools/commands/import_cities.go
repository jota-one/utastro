package commands

import (
	"fmt"

	"github.com/pocketbase/pocketbase"
	"github.com/spf13/cobra"
)

// ImportCitiesCommand imports cities and city watchers from sisi__ legacy tables into ut_ PocketBase collections.
func ImportCitiesCommand(app *pocketbase.PocketBase) *cobra.Command {
	cmd := &cobra.Command{
		Use:   "import-cities",
		Short: "Import cities and city watchers from sisi__ legacy tables into ut_cities and ut_city_watchers",
		RunE: func(cmd *cobra.Command, args []string) error {
			if err := ensureServerStopped(); err != nil {
				return err
			}

			fmt.Println("Starting cities import process...")

			// Clear existing data for idempotent re-runs
			fmt.Println("🧹 Clearing existing data...")
			app.DB().NewQuery(`DELETE FROM ut_city_watchers`).Execute()
			app.DB().NewQuery(`DELETE FROM ut_cities`).Execute()

			// Step 1: sisi__cities → ut_cities
			fmt.Println("\n📥 Step 1: Importing cities...")
			citiesSQL := `
				INSERT OR IGNORE INTO ut_cities (id, label, slug, coords, enabled, legacy_id)
				SELECT
					lower(substr(hex(randomblob(10)), 1, 15)),
					COALESCE(label, ''),
					COALESCE(xid, ''),
					COALESCE(coords, ''),
					CASE enabled WHEN 1 THEN 1 ELSE 0 END,
					id
				FROM sisi__cities
			`
			if _, err := app.DB().NewQuery(citiesSQL).Execute(); err != nil {
				return fmt.Errorf("import cities failed: %w", err)
			}

			var citiesCount int64
			if err := app.DB().NewQuery("SELECT COUNT(*) FROM ut_cities").Row(&citiesCount); err == nil {
				fmt.Printf("✅ Imported %d cities\n", citiesCount)
			}

			// Step 2: sisi__city_watchers → ut_city_watchers
			// Users are resolved through the email so watchers of legacy
			// duplicate accounts land on the surviving account (see
			// import-users), deduplicated per (user, city). The mapping is
			// materialized with an index — a direct join on lower(email)
			// cannot use any index.
			fmt.Println("\n📥 Step 2: Importing city watchers...")
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
			watchersSQL := `
				INSERT OR IGNORE INTO ut_city_watchers (id, "user", city, legacy_user_id, legacy_city_id)
				SELECT
					lower(substr(hex(randomblob(10)), 1, 15)),
					m.user_id,
					c.id,
					COALESCE(MAX(CASE WHEN w.user_id = m.survivor_legacy_id THEN w.user_id END), MAX(w.user_id)),
					w.city_id
				FROM sisi__city_watchers w
				JOIN tmp_user_map m ON m.legacy_id = w.user_id
				JOIN ut_cities c ON c.legacy_id = w.city_id
				GROUP BY m.user_id, c.id
			`
			if _, err := app.DB().NewQuery(watchersSQL).Execute(); err != nil {
				return fmt.Errorf("import city watchers failed: %w", err)
			}
			if _, err := app.DB().NewQuery(`DROP TABLE IF EXISTS tmp_user_map`).Execute(); err != nil {
				return fmt.Errorf("drop user mapping failed: %w", err)
			}

			var watchersCount int64
			if err := app.DB().NewQuery("SELECT COUNT(*) FROM ut_city_watchers").Row(&watchersCount); err == nil {
				fmt.Printf("✅ Imported %d city watchers\n", watchersCount)
			}

			fmt.Println("\n🎉 Cities import complete!")
			return nil
		},
	}

	return cmd
}
