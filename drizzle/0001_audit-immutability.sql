CREATE EXTENSION IF NOT EXISTS "pgcrypto";
--> statement-breakpoint
CREATE OR REPLACE FUNCTION prevent_audit_logs_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is an append-only immutable table. UPDATE, DELETE, and TRUNCATE operations are strictly forbidden.';
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER audit_logs_immutable_row_trigger
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_logs_mutation();
--> statement-breakpoint
CREATE TRIGGER audit_logs_immutable_truncate_trigger
BEFORE TRUNCATE ON audit_logs
FOR EACH STATEMENT EXECUTE FUNCTION prevent_audit_logs_mutation();