/// <reference path="../pb_data/types.d.ts" />

// legacy_id defaults to 0 on records created from the admin UI, so a plain
// unique index breaks as soon as a second record is created. Scope the
// uniqueness to imported records (legacy_id != 0) instead.
const TABLES = ['ut_cities', 'ut_locations', 'ut_event_types', 'ut_events']

const setLegacyIdIndex = (app, table, indexSql) => {
  const collection = app.findCollectionByNameOrId(table)
  collection.indexes = collection.indexes.map(index =>
    index.includes(`idx_${table}_legacy_id`) ? indexSql : index,
  )
  app.save(collection)
}

migrate(
  (app) => {
    TABLES.forEach(table => {
      setLegacyIdIndex(
        app,
        table,
        `CREATE UNIQUE INDEX idx_${table}_legacy_id ON ${table} (legacy_id) WHERE legacy_id != 0`,
      )
    })
  },
  (app) => {
    TABLES.forEach(table => {
      setLegacyIdIndex(
        app,
        table,
        `CREATE UNIQUE INDEX idx_${table}_legacy_id ON ${table} (legacy_id)`,
      )
    })
  },
)
