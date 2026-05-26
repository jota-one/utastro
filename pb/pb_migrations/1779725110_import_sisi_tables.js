/// <reference path="../pb_data/types.d.ts" />

// Migration to create auxiliary sisi__ tables from pb/sql_import_sources/sisi.sql
// Adapted for SQLite: no ENGINE/CHARSET, enums as TEXT, tinyint as INTEGER, no FK constraints.

migrate(
  (app) => {
    const statements = [
      'DROP TABLE IF EXISTS "sisi__cities"',
      `CREATE TABLE IF NOT EXISTS "sisi__cities" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "label" TEXT,
        "xid" TEXT,
        "enabled" INTEGER NOT NULL,
        "coords" TEXT,
        "created_at" TEXT,
        "updated_at" TEXT
      )`,

      'DROP TABLE IF EXISTS "sisi__city_watchers"',
      `CREATE TABLE IF NOT EXISTS "sisi__city_watchers" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "user_id" INTEGER,
        "city_id" INTEGER,
        "created_at" TEXT,
        "updated_at" TEXT
      )`,
      `CREATE INDEX IF NOT EXISTS "idx_sisi_city_watchers_user_id" ON "sisi__city_watchers" ("user_id")`,
      `CREATE INDEX IF NOT EXISTS "idx_sisi_city_watchers_city_id" ON "sisi__city_watchers" ("city_id")`,

      'DROP TABLE IF EXISTS "sisi__event_types"',
      `CREATE TABLE IF NOT EXISTS "sisi__event_types" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "xid" TEXT NOT NULL,
        "enabled" INTEGER NOT NULL DEFAULT 1
      )`,

      'DROP TABLE IF EXISTS "sisi__event_types_events"',
      `CREATE TABLE IF NOT EXISTS "sisi__event_types_events" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "event_id" INTEGER NOT NULL,
        "type_id" INTEGER NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS "idx_sisi_event_types_events_event_id" ON "sisi__event_types_events" ("event_id")`,
      `CREATE INDEX IF NOT EXISTS "idx_sisi_event_types_events_type_id" ON "sisi__event_types_events" ("type_id")`,

      'DROP TABLE IF EXISTS "sisi__event_types_lang"',
      `CREATE TABLE IF NOT EXISTS "sisi__event_types_lang" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "label" TEXT NOT NULL,
        "lang_id" INTEGER NOT NULL,
        "type_id" INTEGER NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS "idx_sisi_event_types_lang_lang_id" ON "sisi__event_types_lang" ("lang_id")`,
      `CREATE INDEX IF NOT EXISTS "idx_sisi_event_types_lang_type_id" ON "sisi__event_types_lang" ("type_id")`,

      'DROP TABLE IF EXISTS "sisi__locations"',
      `CREATE TABLE IF NOT EXISTS "sisi__locations" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "address" TEXT,
        "enabled" INTEGER,
        "coords" TEXT,
        "xid" TEXT,
        "city_id" INTEGER,
        "created_at" TEXT,
        "updated_at" TEXT
      )`,
      `CREATE INDEX IF NOT EXISTS "idx_sisi_locations_city_id" ON "sisi__locations" ("city_id")`,

      'DROP TABLE IF EXISTS "sisi__locations_lang"',
      `CREATE TABLE IF NOT EXISTS "sisi__locations_lang" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "label" TEXT,
        "location_id" INTEGER,
        "lang_id" INTEGER
      )`,
      `CREATE INDEX IF NOT EXISTS "idx_sisi_locations_lang_location_id" ON "sisi__locations_lang" ("location_id")`,
      `CREATE INDEX IF NOT EXISTS "idx_sisi_locations_lang_lang_id" ON "sisi__locations_lang" ("lang_id")`,

      'DROP TABLE IF EXISTS "sisi__events"',
      `CREATE TABLE IF NOT EXISTS "sisi__events" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "start_date" TEXT,
        "end_date" TEXT,
        "subscription_publish_date" TEXT,
        "max_subscriptions" INTEGER,
        "progress" TEXT,
        "attendees" TEXT,
        "location_id" INTEGER,
        "checksum" TEXT,
        "created_at" TEXT,
        "updated_at" TEXT
      )`,
      `CREATE INDEX IF NOT EXISTS "idx_sisi_events_location_id" ON "sisi__events" ("location_id")`,

      'DROP TABLE IF EXISTS "sisi__events_lang"',
      `CREATE TABLE IF NOT EXISTS "sisi__events_lang" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "title" TEXT,
        "description" TEXT,
        "event_id" INTEGER,
        "lang_id" INTEGER
      )`,
      `CREATE INDEX IF NOT EXISTS "idx_sisi_events_lang_event_id" ON "sisi__events_lang" ("event_id")`,
      `CREATE INDEX IF NOT EXISTS "idx_sisi_events_lang_lang_id" ON "sisi__events_lang" ("lang_id")`,

      'DROP TABLE IF EXISTS "sisi__subscriptions"',
      `CREATE TABLE IF NOT EXISTS "sisi__subscriptions" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "presence" INTEGER,
        "is_event_admin" INTEGER NOT NULL DEFAULT 0,
        "user_id" INTEGER,
        "event_id" INTEGER,
        "created_at" TEXT,
        "updated_at" TEXT
      )`,
      `CREATE INDEX IF NOT EXISTS "idx_sisi_subscriptions_user_id" ON "sisi__subscriptions" ("user_id")`,
      `CREATE INDEX IF NOT EXISTS "idx_sisi_subscriptions_event_id" ON "sisi__subscriptions" ("event_id")`,
    ]

    const dbx = app.db()
    statements.forEach((sql) => dbx.newQuery(sql).execute())
  },
  (app) => {
    const tables = [
      'sisi__subscriptions',
      'sisi__events_lang',
      'sisi__events',
      'sisi__locations_lang',
      'sisi__locations',
      'sisi__event_types_lang',
      'sisi__event_types_events',
      'sisi__event_types',
      'sisi__city_watchers',
      'sisi__cities',
    ]
    const dbx = app.db()
    tables.forEach((t) => dbx.newQuery(`DROP TABLE IF EXISTS "${t}"`).execute())
  }
)
