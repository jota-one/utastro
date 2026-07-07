package commands

import (
	"fmt"
	"net"
	"os"
	"time"
)

// defaultServePort mirrors the `db` npm script: pocketbase serve --http=127.0.0.1:8091
const defaultServePort = "8091"

// ensureServerStopped refuses to run an import while a PocketBase instance is
// serving on the DB port. Concurrent access to the same SQLite data.db can
// leave a partial import (early chunks committed, later ones aborted on a lock)
// with no obvious error. Override the port with PB_IMPORT_PORT; bypass the
// check entirely with PB_IMPORT_SKIP_GUARD=1.
func ensureServerStopped() error {
	if os.Getenv("PB_IMPORT_SKIP_GUARD") == "1" {
		return nil
	}

	port := os.Getenv("PB_IMPORT_PORT")
	if port == "" {
		port = defaultServePort
	}

	addr := net.JoinHostPort("127.0.0.1", port)
	conn, err := net.DialTimeout("tcp", addr, 300*time.Millisecond)
	if err != nil {
		// Nothing listening — safe to import.
		return nil
	}
	conn.Close()

	return fmt.Errorf(
		"PocketBase appears to be running on port %s.\n"+
			"Imports write directly to pb_data/data.db and must run with the server stopped,\n"+
			"otherwise SQLite lock contention can silently drop rows.\n"+
			"Stop it (e.g. Ctrl-C the `npm run db` terminal) and re-run.\n"+
			"Override the port with PB_IMPORT_PORT, or bypass with PB_IMPORT_SKIP_GUARD=1.",
		port,
	)
}
