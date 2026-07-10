/// <reference path="../pb_data/types.d.ts" />

// Cap the sponsor logo upload size to 150kB.
migrate(
  app => {
    const collection = app.findCollectionByNameOrId('ut_sponsors')
    const logo = collection.fields.getById('file_sponsors_logo')
    logo.maxSize = 153600
    app.save(collection)
  },
  app => {
    const collection = app.findCollectionByNameOrId('ut_sponsors')
    const logo = collection.fields.getById('file_sponsors_logo')
    logo.maxSize = 5242880
    app.save(collection)
  },
)
