package commands

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/spf13/cobra"
)

// ImportDataCommand creates a CLI command to bulk import JSON data into any table
func ImportDataCommand(app *pocketbase.PocketBase) *cobra.Command {
	var (
		table     string
		file      string
		chunkSize int
	)

	cmd := &cobra.Command{
		Use:   "import-data",
		Short: "Bulk import JSON data into a table",
		Long:  "Import data from a JSON file into any SQLite table. Supports chunking for large datasets.",
		Example: `  pb-custom import-data --table=ut__userinfos --file=data.json --chunk-size=1000`,
		RunE: func(cmd *cobra.Command, args []string) error {
			// Validate flags
			if table == "" {
				return fmt.Errorf("--table is required")
			}
			if file == "" {
				return fmt.Errorf("--file is required")
			}

			// Read JSON file
			data, err := os.ReadFile(file)
			if err != nil {
				return fmt.Errorf("failed to read file: %w", err)
			}

			// Parse JSON - try PHPMyAdmin format first, then simple array
			var records []map[string]interface{}
			
			// Try to parse as PHPMyAdmin format
			var phpMyAdminData []map[string]interface{}
			if err := json.Unmarshal(data, &phpMyAdminData); err != nil {
				return fmt.Errorf("failed to parse JSON: %w", err)
			}
			
			// Look for the table data object
			for _, item := range phpMyAdminData {
				if itemType, ok := item["type"].(string); ok && itemType == "table" {
					if dataArray, ok := item["data"].([]interface{}); ok {
						// Convert []interface{} to []map[string]interface{}
						for _, record := range dataArray {
							if recordMap, ok := record.(map[string]interface{}); ok {
								records = append(records, recordMap)
							}
						}
						break
					}
				}
			}
			
			// If no data found in PHPMyAdmin format, try simple array format
			if len(records) == 0 {
				if err := json.Unmarshal(data, &records); err != nil {
					return fmt.Errorf("failed to parse JSON as simple array: %w", err)
				}
			}

			fmt.Printf("Loaded %d records from %s\n", len(records), file)

			// Process in chunks
			totalInserted := 0
			for i := 0; i < len(records); i += chunkSize {
				end := i + chunkSize
				if end > len(records) {
					end = len(records)
				}
				chunk := records[i:end]

				// Insert chunk in a transaction
				err := app.RunInTransaction(func(txApp core.App) error {
					for _, record := range chunk {
						// Build dynamic INSERT statement
						columns := []string{}
						placeholders := []string{}
						
						for key := range record {
							columns = append(columns, key)
							placeholders = append(placeholders, "{:"+key+"}")
						}

						sql := fmt.Sprintf(
							"INSERT OR REPLACE INTO %s (%s) VALUES (%s)",
							table,
							joinStrings(columns, ", "),
							joinStrings(placeholders, ", "),
						)

						// Build named params map
						params := make(map[string]interface{})
						for key, value := range record {
							params[key] = value
						}

						if _, err := txApp.DB().NewQuery(sql).Bind(params).Execute(); err != nil {
							return fmt.Errorf("insert failed: %w", err)
						}
					}
					return nil
				})

				if err != nil {
					return fmt.Errorf("chunk insert failed at row %d: %w", i, err)
				}

				totalInserted += len(chunk)
				fmt.Printf("Inserted %d/%d rows...\n", totalInserted, len(records))
			}

			fmt.Printf("✅ Successfully imported %d records into %s\n", totalInserted, table)
			return nil
		},
	}

	cmd.Flags().StringVar(&table, "table", "", "Target table name (required)")
	cmd.Flags().StringVar(&file, "file", "", "JSON file path (required)")
	cmd.Flags().IntVar(&chunkSize, "chunk-size", 1000, "Number of records per transaction")
	
	cmd.MarkFlagRequired("table")
	cmd.MarkFlagRequired("file")

	return cmd
}

// joinStrings joins string slices (helper for SQL generation)
func joinStrings(strs []string, sep string) string {
	result := ""
	for i, s := range strs {
		if i > 0 {
			result += sep
		}
		result += s
	}
	return result
}
