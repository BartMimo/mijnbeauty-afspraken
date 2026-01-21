-- Enforce salon lead_time_hours on appointments at the DB level
-- Prevent inserts/updates of appointments scheduled earlier than now + lead_time_hours

CREATE OR REPLACE FUNCTION public.enforce_lead_time() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  salon_rec RECORD;
  appointment_ts timestamp;
  cutoff_ts timestamp;
  lead_hours integer := 0;
BEGIN
  -- Fetch salon lead_time_hours (try by id then by slug)
  IF NEW.salon_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT lead_time_hours INTO lead_hours FROM public.salons WHERE id = NEW.salon_id LIMIT 1;
  IF NOT FOUND THEN
    SELECT lead_time_hours INTO lead_hours FROM public.salons WHERE slug = NEW.salon_id LIMIT 1;
  END IF;

  lead_hours := COALESCE(lead_hours, 0);

  IF lead_hours <= 0 OR NEW.date IS NULL OR NEW.time IS NULL THEN
    RETURN NEW;
  END IF;

  -- Build appointment timestamp from date and time (assumes local server timezone)
  BEGIN
    appointment_ts := (NEW.date::text || ' ' || NEW.time::text)::timestamp;
  EXCEPTION WHEN others THEN
    -- If we can't parse timestamp, allow DB to validate/insert and let other constraints handle it
    RETURN NEW;
  END;

  cutoff_ts := now() + (lead_hours || ' hours')::interval;

  IF appointment_ts < cutoff_ts THEN
    RAISE EXCEPTION 'Salon vereist minimaal % uur van tevoren boeken', lead_hours;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to call the function before insert or update on appointments
DROP TRIGGER IF EXISTS trigger_enforce_lead_time ON public.appointments;
CREATE TRIGGER trigger_enforce_lead_time
BEFORE INSERT OR UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.enforce_lead_time();
