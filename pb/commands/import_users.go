package commands

import (
	"fmt"

	"github.com/pocketbase/pocketbase"
	"github.com/spf13/cobra"
)

// ImportUsersCommand imports ut_users from hypercontent__users and optionally enriches from ut__userinfos
func ImportUsersCommand(app *pocketbase.PocketBase) *cobra.Command {
	var skipUserinfos bool

	cmd := &cobra.Command{
		Use:   "import-users",
		Short: "Import users from hypercontent__users and enrich with ut__userinfos",
		Long:  "Imports user records from hypercontent__users table into ut_users collection. By default, also enriches with data from ut__userinfos table.",
		Example: `  pb-custom import-users
  pb-custom import-users --skip-userinfos`,
		RunE: func(cmd *cobra.Command, args []string) error {
			fmt.Println("Starting user import process...")

			// Step 1: Import from hypercontent__users → ut_users
			fmt.Println("\n📥 Step 1: Importing from hypercontent__users...")
            importSQL := `
    INSERT OR IGNORE INTO ut_users (
      email, name, role, legacy_id, legacy_password_sha1,
      soft_deleted, verified, emailVisibility, password, tokenKey
    )
    SELECT 
      email,
      TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')),
      CASE role_id
        WHEN 1 THEN 'superadmin'
        WHEN 2 THEN 'admin'
        WHEN 3 THEN 'user'
        WHEN 4 THEN 'coach'
        ELSE 'user'
      END,
      id,
      password,
      COALESCE(soft_deleted, 0),
      0,
      0,
      'Temp#' || id || '!2025',
      hex(randomblob(16))
    FROM hypercontent__users
    WHERE email IS NOT NULL AND email != ''
  `

			if _, err := app.DB().NewQuery(importSQL).Execute(); err != nil {
				return fmt.Errorf("import from hypercontent__users failed: %w", err)
			}

			// Count imported records
			var count int64
			if err := app.DB().NewQuery("SELECT COUNT(*) FROM ut_users WHERE legacy_id IS NOT NULL").Row(&count); err == nil {
				fmt.Printf("✅ Imported %d users from hypercontent__users\n", count)
			}

			// Step 2: Enrich from ut__userinfos (optional)
			if !skipUserinfos {
				fmt.Println("\n📝 Step 2: Enriching with ut__userinfos...")
				enrichSQL := `
      UPDATE ut_users
      SET
        street = COALESCE(ui.street, ut_users.street),
        npa = COALESCE(ui.npa, ut_users.npa),
        city = COALESCE(ui.city, ut_users.city),
        country = COALESCE(ui.country, ut_users.country),
        phone = COALESCE(ui.phone, ut_users.phone),
        gender = COALESCE(
          CASE lower(ui.gender)
            WHEN 'male' THEN 'male'
            WHEN 'female' THEN 'female'
            WHEN 'other' THEN 'other'
            ELSE NULL
          END,
          ut_users.gender
        ),
        region = COALESCE(
          CASE ui.region_id
            WHEN 8 THEN 'AG' WHEN 9 THEN 'AI' WHEN 10 THEN 'AR' WHEN 11 THEN 'BE'
            WHEN 12 THEN 'BL' WHEN 13 THEN 'BS' WHEN 14 THEN 'FR' WHEN 15 THEN 'GE'
            WHEN 16 THEN 'GL' WHEN 17 THEN 'GR' WHEN 18 THEN 'JU' WHEN 19 THEN 'LU'
            WHEN 20 THEN 'NE' WHEN 21 THEN 'NW' WHEN 22 THEN 'OW' WHEN 23 THEN 'SG'
            WHEN 24 THEN 'SH' WHEN 25 THEN 'SO' WHEN 26 THEN 'SZ' WHEN 27 THEN 'TG'
            WHEN 28 THEN 'TI' WHEN 29 THEN 'UR' WHEN 30 THEN 'VD' WHEN 31 THEN 'VS'
            WHEN 32 THEN 'ZH'
            ELSE NULL
          END,
          ut_users.region
        ),
        accept_risks = COALESCE(
          CASE ui.accept_risks WHEN 1 THEN 1 WHEN 0 THEN 0 ELSE NULL END,
          ut_users.accept_risks
        ),
        accept_promo = COALESCE(
          CASE ui.accept_promo WHEN 1 THEN 1 WHEN 0 THEN 0 ELSE NULL END,
          ut_users.accept_promo
        ),
        accept_newsletter = COALESCE(
          CASE ui.accept_newsletter WHEN 1 THEN 1 WHEN 0 THEN 0 ELSE NULL END,
          ut_users.accept_newsletter
        ),
        birthdate = COALESCE(ui.birthdate, ut_users.birthdate)
      FROM ut__userinfos ui
      WHERE ui.user_id = ut_users.legacy_id;
    `

				if _, err := app.DB().NewQuery(enrichSQL).Execute(); err != nil {
					return fmt.Errorf("enrichment from ut__userinfos failed: %w", err)
				}

				// Count enriched records
				var enrichCount int64
				if err := app.DB().NewQuery("SELECT COUNT(*) FROM ut_users WHERE street IS NOT NULL").Row(&enrichCount); err == nil {
					fmt.Printf("✅ Enriched %d users with userinfos data\n", enrichCount)
				}
			}

			fmt.Println("\n🎉 User import complete!")
			return nil
		},
	}

	cmd.Flags().BoolVar(&skipUserinfos, "skip-userinfos", false, "Skip enrichment from ut__userinfos table")

	return cmd
}
