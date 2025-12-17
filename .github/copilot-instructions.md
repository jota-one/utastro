<!-- Copilot / AI Agent instructions — ut-astro (Astro + PocketBase) -->

# Copilot Instructions for ut-astro

## Quick reference: Testing & verifying PocketBase migrations

### Direct SQLite queries to verify migration success

After applying a migration with `pb/pocketbase migrate up`, use sqlite3 to quickly validate results:

```bash
# Count affected rows (e.g., after UPDATE migrations)
sqlite3 pb/pb_data/data.db "SELECT COUNT(*) FROM ut_users WHERE street IS NOT NULL;"

# Sample verify: show a few updated records with key fields
sqlite3 pb/pb_data/data.db "SELECT legacy_id, street, city, region, gender FROM ut_users WHERE street IS NOT NULL LIMIT 5;"

# Check for NULL mapping issues (e.g., region mapping failed)
sqlite3 pb/pb_data/data.db "SELECT COUNT(*) as missing_region FROM ut_users WHERE street IS NOT NULL AND region IS NULL;"

# Full record inspection for a specific user
sqlite3 pb/pb_data/data.db "SELECT * FROM ut_users WHERE legacy_id = 18;"
```

**Why this works:**
- PocketBase stores data in SQLite at `pb/pb_data/data.db`
- Direct SQLite queries bypass the HTTP API and show raw schema state
- Fast feedback loop: run migration → immediate verification → iterate if needed

### Common migration patterns

**UPDATE with JOIN + COALESCE** (preferred for efficiency):
```javascript
const sql = `
  UPDATE target_table
  SET col1 = COALESCE(source.field1, target_table.col1),
      col2 = COALESCE(source.field2, target_table.col2)
  FROM source_table source
  WHERE source.key_col = target_table.legacy_id;
`;
app.db().newQuery(sql).execute();
```

This is more efficient than multiple correlated subqueries. Avoid:
```javascript
// ❌ SLOW: one SELECT per column
SET col1 = (SELECT ... LIMIT 1), col2 = (SELECT ... LIMIT 1), ...
```

**Region ID mapping pattern:**
```javascript
CASE region_id
  WHEN 8 THEN 'AG' WHEN 9 THEN 'AI' WHEN 10 THEN 'AR' WHEN 11 THEN 'BE'
  WHEN 12 THEN 'BL' WHEN 13 THEN 'BS' WHEN 14 THEN 'FR' WHEN 15 THEN 'GE'
  -- ... etc for all 25 Swiss cantons
  ELSE NULL
END
```

**MySQL → SQLite escaping:**
- MySQL uses `\'` for literal single quote; SQLite expects `''`
- Backticks (`` ` ``) are MySQL; SQLite uses double quotes or no quotes
- Apply: `sql.replace(/\\'/g, "''").replace(/`/g, "")`

### Migration checklist

- [ ] Single-table INSERT: test row count with `COUNT(*) WHERE id > X`
- [ ] UPDATE...FROM: sample a few records to verify field mapping
- [ ] Enum/CASE mapping: spot-check conversion (e.g., region_id → 2-char code)
- [ ] NULL handling: verify COALESCE preserves existing values
- [ ] Rollback: test `pnpm migrate:down` to ensure down() is correct

---

## General project notes (from parent instructions)

See parent directory `.github/copilot-instructions.md` for broader Astro + PocketBase architecture.
