package commands

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/pocketbase/pocketbase"
	"github.com/spf13/cobra"
)

func ImportAllDataCommand(app *pocketbase.PocketBase) *cobra.Command {
	var (
		dir       string
		chunkSize int
	)

	cmd := &cobra.Command{
		Use:     "import-all-data",
		Short:   "Bulk import all JSON files from a directory into their respective tables",
		Example: `  pb-custom import-all-data --input=sql_import_sources`,
		RunE: func(cmd *cobra.Command, args []string) error {
			if err := ensureServerStopped(); err != nil {
				return err
			}

			entries, err := os.ReadDir(dir)
			if err != nil {
				return fmt.Errorf("failed to read directory %s: %w", dir, err)
			}

			skipped := []string{}
			for _, entry := range entries {
				if entry.IsDir() || filepath.Ext(entry.Name()) != ".json" {
					continue
				}

				table := strings.TrimSuffix(entry.Name(), ".json")
				file := filepath.Join(dir, entry.Name())

				if !tableExists(app, table) {
					fmt.Printf("\n⏭  Skipping %s — no table %q (create a migration first)\n", entry.Name(), table)
					skipped = append(skipped, table)
					continue
				}

				fmt.Printf("\n→ Importing %s into table %s\n", entry.Name(), table)
				if err := importTableFromFile(app, table, file, chunkSize); err != nil {
					return fmt.Errorf("failed to import %s: %w", entry.Name(), err)
				}
			}

			if len(skipped) > 0 {
				fmt.Printf("\n⚠️  Skipped %d file(s) with no matching table: %s\n", len(skipped), strings.Join(skipped, ", "))
			}

			return nil
		},
	}

	cmd.Flags().StringVar(&dir, "input", "json_import_sources", "Directory containing JSON files")
	cmd.Flags().IntVar(&chunkSize, "chunk-size", 1000, "Number of records per transaction")

	return cmd
}
