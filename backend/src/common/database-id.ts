// PostgreSQL accepts UUIDs already present in older fixtures without requiring RFC version bits.
export const databaseIdPattern = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
