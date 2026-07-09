/// <reference path="../pb_data/types.d.ts" />

// Enable the batch API for bulk admin operations (events CSV import).
migrate(
  (app) => {
    const settings = app.settings()
    settings.batch.enabled = true
    settings.batch.maxRequests = 500
    settings.batch.timeout = 30
    app.save(settings)
  },
  (app) => {
    const settings = app.settings()
    settings.batch.enabled = false
    app.save(settings)
  },
)
