-- Function for memory_event deletion
CREATE OR REPLACE FUNCTION delete_orphaned_memories_func()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if this was the last event for this memory
    IF NOT EXISTS (SELECT 1 FROM memory_event WHERE memory_id = OLD.memory_id) THEN
        -- If no events remain, delete the memory
        DELETE FROM memory WHERE id = OLD.memory_id;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

-- Trigger for memory_event
CREATE TRIGGER delete_orphaned_memories
AFTER DELETE ON memory_event
FOR EACH ROW
EXECUTE FUNCTION delete_orphaned_memories_func();
--> statement-breakpoint

-- Function for memory_tasks deletion
CREATE OR REPLACE FUNCTION delete_orphaned_tasks_func()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if this was the last task for this memory
    IF NOT EXISTS (SELECT 1 FROM memory_tasks WHERE memory_id = OLD.memory_id) THEN
        -- If no tasks remain, delete the memory
        DELETE FROM memory WHERE id = OLD.memory_id;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

-- Trigger for memory_tasks
CREATE TRIGGER delete_orphaned_tasks
AFTER DELETE ON memory_tasks
FOR EACH ROW
EXECUTE FUNCTION delete_orphaned_tasks_func();
--> statement-breakpoint