# WorkEntry to WorkSession Migration

This document describes the migration process from the old `WorkEntry` model to the new `WorkSession` model.

## Overview

The migration converts the old entry-based system (where clock-in and clock-out were separate entries) to a new session-based system (where a session contains both start and end times).

### Old Structure (WorkEntry)
```java
WorkEntry {
    id: Long
    user: User
    timestamp: LocalDateTime
    type: CLOCK_IN | CLOCK_OUT
    notes: String
}
```

### New Structure (WorkSession)
```java
WorkSession {
    id: Long
    user: User
    startTime: LocalDateTime
    endTime: LocalDateTime (nullable)
    notes: String
}
```

## Migration Process

The migration consists of two phases:

1. **Data Migration**: Converts existing `WorkEntry` records to `WorkSession` records
2. **Cleanup**: Removes old `WorkEntry` records after successful migration

## Automatic Migration

The migration runs automatically when the application starts if:
- There are existing `WorkEntry` records
- No `WorkSession` records exist yet

This prevents data duplication and ensures the migration only runs once.

## Manual Migration via API

You can also trigger the migration manually using the following API endpoints:

### Check Migration Status
```bash
GET /api/v1/migration/status
```

Response:
```json
{
  "workEntryCount": 150,
  "workSessionCount": 0,
  "migrationNeeded": true,
  "cleanupPossible": false
}
```

### Run Migration Only
```bash
POST /api/v1/migration/run
```

### Run Cleanup Only
```bash
POST /api/v1/migration/cleanup
```

### Run Migration and Cleanup
```bash
POST /api/v1/migration/run-all
```

## Migration Logic

### Session Creation
1. **Complete Sessions**: Pairs clock-in and clock-out entries to create complete sessions
2. **Incomplete Sessions**: Creates sessions with only start time for orphaned clock-in entries
3. **Notes Handling**: Prefers clock-in notes, falls back to clock-out notes if clock-in notes are empty

### Orphaned Entries
- **Orphaned Clock-Out**: Clock-out entries without corresponding clock-in entries are logged as warnings
- **Orphaned Clock-In**: Clock-in entries without corresponding clock-out entries become incomplete sessions

## Safety Features

- **Idempotent**: Migration only runs if no `WorkSession` data exists
- **Transactional**: All operations are wrapped in transactions
- **Logging**: Comprehensive logging for debugging and monitoring
- **Validation**: Checks data integrity before and after migration

## Rollback Strategy

If you need to rollback the migration:

1. **Before Cleanup**: Simply restart the application - the migration will be skipped
2. **After Cleanup**: You'll need to restore from a database backup

## Testing the Migration

1. **Backup your database** before running the migration
2. **Test on a copy** of your production data first
3. **Verify the results** by checking:
   - Session counts match expected values
   - Session durations are correct
   - Notes are preserved appropriately
   - No data loss occurred

## Example Migration Output

```
Starting WorkEntry to WorkSession migration...
Found 150 WorkEntry records to migrate
Migrating entries for user: john.doe
Found 75 clock-in entries and 75 clock-out entries for user: john.doe
Created session: 2024-01-15T09:00:00 - 2024-01-15T17:00:00 (8.0h)
User john.doe migration complete: 75 sessions created, 0 orphaned entries
Migration completed successfully!
Starting WorkEntry cleanup migration...
Found 150 WorkEntry records to clean up
Found 75 WorkSession records (migration appears successful)
Proceeding with WorkEntry cleanup...
Cleanup completed. Remaining WorkEntry records: 0
WorkEntry cleanup successful!
```

## Troubleshooting

### Common Issues

1. **Migration Skipped**: Check if `WorkSession` data already exists
2. **Orphaned Entries**: Review logs for orphaned clock-out entries
3. **Data Mismatch**: Verify session counts and durations

### Logs to Monitor

- `WorkEntryToSessionMigration`: Main migration process
- `WorkEntryCleanupMigration`: Cleanup process
- `MigrationController`: Manual migration triggers

## Post-Migration

After successful migration:

1. **Update Frontend**: Ensure frontend is using the new session-based API
2. **Remove Old Code**: Clean up `WorkEntry` related code (optional)
3. **Monitor**: Watch for any issues with the new session-based system
4. **Backup**: Create a backup of the migrated data 