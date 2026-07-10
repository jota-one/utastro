package commands

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/filesystem"
	"github.com/spf13/cobra"
)

// pmaTable extracts the row list of a phpMyAdmin JSON export.
func pmaTable(path string) ([]map[string]any, error) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var sections []struct {
		Type string           `json:"type"`
		Data []map[string]any `json:"data"`
	}
	if err := json.Unmarshal(raw, &sections); err != nil {
		return nil, err
	}
	for _, section := range sections {
		if section.Type == "table" {
			return section.Data, nil
		}
	}
	return nil, fmt.Errorf("no table section in %s", path)
}

func pmaString(row map[string]any, key string) string {
	if value, ok := row[key].(string); ok {
		return value
	}
	return ""
}

// ImportSponsorsCommand imports sponsors (records + logo files) from the
// ut__sponsors* phpMyAdmin JSON exports into the ut_sponsors collection.
func ImportSponsorsCommand(app *pocketbase.PocketBase) *cobra.Command {
	cmd := &cobra.Command{
		Use:   "import-sponsors",
		Short: "Import sponsors and their logos from the ut__sponsors* JSON exports",
		RunE: func(cmd *cobra.Command, args []string) error {
			if err := ensureServerStopped(); err != nil {
				return err
			}

			fmt.Println("Starting sponsors import process...")

			sourcesDir := "json_import_sources"
			logosDir := filepath.Join(sourcesDir, "ut__sponsors_logos")

			sponsors, err := pmaTable(filepath.Join(sourcesDir, "ut__sponsors.json"))
			if err != nil {
				return err
			}
			langRows, err := pmaTable(filepath.Join(sourcesDir, "ut__sponsors_lang.json"))
			if err != nil {
				return err
			}
			cityRows, err := pmaTable(filepath.Join(sourcesDir, "ut__sponsors_cities.json"))
			if err != nil {
				return err
			}

			// name/link per sponsor: prefer the french row, fall back to any.
			// Sponsor 45 (Decathlon) has no ut__sponsors_lang row in the legacy
			// DB (its 45.svg logo is byte-identical to decathlon.svg) — patch it
			// here so the only enabled global sponsor is not dropped.
			langBySponsor := map[string]map[string]any{
				"45": {"name": "Decathlon", "link_href": "https://www.decathlon.ch"},
			}
			for _, row := range langRows {
				sponsorID := pmaString(row, "sponsor_id")
				if _, exists := langBySponsor[sponsorID]; !exists || pmaString(row, "lang_id") == "1" {
					langBySponsor[sponsorID] = row
				}
			}

			// legacy city id -> PB city record id
			cityRecords, err := app.FindAllRecords("ut_cities")
			if err != nil {
				return err
			}
			cityByLegacyID := map[string]string{}
			for _, city := range cityRecords {
				cityByLegacyID[fmt.Sprintf("%v", city.GetInt("legacy_id"))] = city.Id
			}
			citiesBySponsor := map[string][]string{}
			for _, row := range cityRows {
				sponsorID := pmaString(row, "sponsor_id")
				if cityID, ok := cityByLegacyID[pmaString(row, "city_id")]; ok {
					citiesBySponsor[sponsorID] = append(citiesBySponsor[sponsorID], cityID)
				}
			}

			// clear existing records (removes the stored logo files too)
			fmt.Println("🧹 Clearing existing sponsors...")
			existing, err := app.FindAllRecords("ut_sponsors")
			if err != nil {
				return err
			}
			for _, record := range existing {
				if err := app.Delete(record); err != nil {
					return err
				}
			}

			collection, err := app.FindCollectionByNameOrId("ut_sponsors")
			if err != nil {
				return err
			}

			fmt.Println("\n📥 Importing sponsors...")
			imported := 0
			for _, sponsor := range sponsors {
				sponsorID := pmaString(sponsor, "id")

				lang, hasLang := langBySponsor[sponsorID]
				if !hasLang {
					fmt.Printf("⚠️  Sponsor %s skipped: no name found\n", sponsorID)
					continue
				}

				var logoPath string
				for _, ext := range []string{"svg", "png", "jpg"} {
					candidate := filepath.Join(logosDir, sponsorID+"."+ext)
					if _, err := os.Stat(candidate); err == nil {
						logoPath = candidate
						break
					}
				}
				if logoPath == "" {
					fmt.Printf("⚠️  Sponsor %s (%s) skipped: no logo file\n", sponsorID, pmaString(lang, "name"))
					continue
				}

				logo, err := filesystem.NewFileFromPath(logoPath)
				if err != nil {
					return err
				}

				record := core.NewRecord(collection)
				record.Set("name", pmaString(lang, "name"))
				record.Set("link", pmaString(lang, "link_href"))
				record.Set("global", pmaString(sponsor, "is_global") == "1")
				record.Set("enabled", pmaString(sponsor, "enabled") == "1")
				record.Set("cities", citiesBySponsor[sponsorID])
				record.Set("logo", logo)
				if err := app.Save(record); err != nil {
					return fmt.Errorf("save sponsor %s failed: %w", sponsorID, err)
				}
				imported++
			}
			fmt.Printf("✅ Imported %d sponsors\n", imported)

			fmt.Println("\n🎉 Sponsors import complete!")
			return nil
		},
	}

	return cmd
}
