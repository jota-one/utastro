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

			// Step 2: sisi__city_watchers → ut_city_watchers (resolve PB IDs via legacy_id)
			fmt.Println("\n📥 Step 2: Importing city watchers...")
			watchersSQL := `
				INSERT OR IGNORE INTO ut_city_watchers (id, "user", city, legacy_user_id, legacy_city_id)
				SELECT
					lower(substr(hex(randomblob(10)), 1, 15)),
					u.id,
					c.id,
					w.user_id,
					w.city_id
				FROM sisi__city_watchers w
				JOIN ut_users u ON u.legacy_id = w.user_id
				JOIN ut_cities c ON c.legacy_id = w.city_id
			`
			if _, err := app.DB().NewQuery(watchersSQL).Execute(); err != nil {
				return fmt.Errorf("import city watchers failed: %w", err)
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
