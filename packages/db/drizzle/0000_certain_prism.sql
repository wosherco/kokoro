-- Custom SQL migration file, put you code below! --

-- Creating extensions

CREATE EXTENSION IF NOT EXISTS vector; -- For vector search
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- For trigram matching
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;  -- For phonetic matching and Levenshtein
CREATE EXTENSION IF NOT EXISTS plpython3u;

-- SQL to create powersync user
-- Create a role/user with replication privileges for PowerSync
CREATE ROLE powersync_role WITH REPLICATION LOGIN PASSWORD 'myhighlyrandompassword';
-- Set up permissions for the newly created role
-- Read-only (SELECT) access is required
GRANT SELECT ON ALL TABLES IN SCHEMA public TO powersync_role;

-- Create a publication to replicate tables.
-- Specify a subset of tables to replicate if required.
-- NOTE: this must be named "powersync" at the moment
CREATE PUBLICATION powersync FOR ALL TABLES;

-- Function to check if a recurrence is between two dates
CREATE OR REPLACE FUNCTION matching_recurrences(
    start_date TIMESTAMPTZ,
    rrule_str TEXT,
    query_start_date TIMESTAMPTZ,
    query_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS BOOLEAN
AS $$
    from dateutil import rrule, parser
    from datetime import timezone

    def has_timezone_info(dt):
        return dt.tzinfo is not None

    def normalize_date(dt):
        if has_timezone_info(dt):
            return dt.astimezone(timezone.utc).replace(tzinfo=None)
        return dt

    try:
        # Parse ISO date strings to datetime objects, convert to UTC, and remove timezone info
        start = normalize_date(parser.parse(query_start_date))
        end = normalize_date(parser.parse(query_end_date)) if query_end_date is not None else None
        
        rruleset = rrule.rrulestr(rrule_str, dtstart=normalize_date(parser.parse(start_date)))
            
        # Calculate occurrences (using naive datetimes)
        dates = list(rruleset.xafter(start, count=1, inc=True))
        
        if len(dates) == 0:
            return False
        
        if end is None:
            return True
        else:
            # Compare naive datetimes
            return dates[0] < end
        
    except Exception as e:
        plpy.error(f"Error processing RRULE: {str(e)}")
        
$$ LANGUAGE plpython3u;