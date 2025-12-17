/// <reference path="../pb_data/types.d.ts" />

// Migration to import the structure from pb/sql_import_sources/ut__userinfos.sql
// Adjusted for SQLite: removed engine/charset/auto_increment clauses and foreign key constraint.

migrate(
  (app) => {
    const statements = [
      'DROP TABLE IF EXISTS "ut__userinfos"',
      `CREATE TABLE IF NOT EXISTS "ut__userinfos" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "street" TEXT,
        "npa" INTEGER,
        "city" TEXT,
        "country" TEXT,
        "phone" TEXT,
        "gender" TEXT,
        "accept_risks" INTEGER,
        "accept_promo" INTEGER,
        "accept_newsletter" INTEGER,
        "region_id" INTEGER,
        "user_id" INTEGER,
        "created_at" TEXT,
        "updated_at" TEXT,
        "birthdate" INTEGER
      )`,
      `CREATE INDEX IF NOT EXISTS "idx_ut_userinfos_user_id" ON "ut__userinfos" ("user_id")`,
    ]

    const dbx = app.db()
    statements.forEach((sql) => dbx.newQuery(sql).execute())
  },
  (app) => {
    app.db().newQuery('DROP TABLE IF EXISTS "ut__userinfos"').execute()
  }
)
