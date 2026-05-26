package main

import (
	"log"
	"os"

	"github.com/jota-one/ut-astro/commands"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
)

func main() {
	app := pocketbase.New()

	// Register custom import commands
	app.RootCmd.AddCommand(commands.ImportDataCommand(app))
	app.RootCmd.AddCommand(commands.ImportUsersCommand(app))

	// Serve static files from pb_public (same as default pocketbase binary)
	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		se.Router.GET("/{path...}", apis.Static(os.DirFS("./pb_public"), false))
		return se.Next()
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
