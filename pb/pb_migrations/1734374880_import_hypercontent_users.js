/// <reference path="../pb_data/types.d.ts" />

// Migration to import the MySQL dump from pb/sql_import_sources/hypercontent__users.sql
// Adjusted for SQLite: removed engine/charset/auto_increment clauses and foreign key constraint.

migrate(
  (app) => {
    const statements = [
      'DROP TABLE IF EXISTS "hypercontent__users"',
      `CREATE TABLE IF NOT EXISTS "hypercontent__users" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "email" TEXT,
        "password" TEXT,
        "first_name" TEXT,
        "last_name" TEXT,
        "account_pending" TEXT,
        "password_pending" TEXT,
        "role_id" INTEGER,
        "created_at" TEXT,
        "updated_at" TEXT,
        "soft_deleted" INTEGER
      )`,
      `CREATE INDEX IF NOT EXISTS "idx_hypercontent_users_role_id" ON "hypercontent__users" ("role_id")`,
    ]

    const dbx = app.db()
    statements.forEach((sql) => dbx.newQuery(sql).execute())
  },
  (app) => {
    app.db().newQuery('DROP TABLE IF EXISTS "hypercontent__users"').execute()
  }
)
