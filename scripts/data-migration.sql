-- HADAMI Data Migration: Old Project -> New Project
-- User ID Mapping:
-- kopperian432432: 10dec6ee -> 751ac531-dcdb-4e77-a3ea-67a01677c432
-- sya4sya3mi: 23cf937b -> 7fdb8089-4d01-4067-9e13-dcbe265fce2b

-- Disable triggers temporarily for bulk insert
ALTER TABLE profiles DISABLE TRIGGER enforce_beta_user_limit;
ALTER TABLE profiles DISABLE TRIGGER on_auth_user_created;

-- Re-enable triggers after migration
-- ALTER TABLE profiles ENABLE TRIGGER enforce_beta_user_limit;
-- ALTER TABLE profiles ENABLE TRIGGER on_auth_user_created;
