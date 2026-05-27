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
		Example: `  pb-custom import-all-data --dir=sql_import_sources`,
		RunE: func(cmd *cobra.Command, args []string) error {
			entries, err := os.ReadDir(dir)
			if err != nil {
				return fmt.Errorf("failed to read directory %s: %w", dir, err)
			}

			for _, entry := range entries {
				if entry.IsDir() || filepath.Ext(entry.Name()) != ".json" {
					continue
				}

				table := strings.TrimSuffix(entry.Name(), ".json")
				file := filepath.Join(dir, entry.Name())

				fmt.Printf("\n→ Importing %s into table %s\n", entry.Name(), table)
				if err := importTableFromFile(app, table, file, chunkSize); err != nil {
					return fmt.Errorf("failed to import %s: %w", entry.Name(), err)
				}
			}

			return nil
		},
	}

	cmd.Flags().StringVar(&dir, "dir", "json_import_sources", "Directory containing JSON files")
	cmd.Flags().IntVar(&chunkSize, "chunk-size", 1000, "Number of records per transaction")

	return cmd
}
