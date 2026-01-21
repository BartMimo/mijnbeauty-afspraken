import { supabase } from './supabase';

// Insert appointment robustly. Some deployments may have different columns present.
// Strategy: try the full insert, and if the DB complains about a missing column
// (e.g., `service_name`), retry without that column. We need to handle both
// - the Supabase client returning an `error` object, and
// - the client throwing an exception.
export async function insertAppointmentSafe(appointment: Record<string, any>) {
  // Enforce salon-configured lead time (hours) on the server-side before inserting.
  try {
    const salonId = appointment.salon_id;
    if (salonId) {
      // Try to fetch by UUID/id first; if not found, try slug fallback
      let { data: salonData } = await supabase.from('salons').select('id, lead_time_hours').eq('id', salonId).maybeSingle();
      if (!salonData) {
        const res = await supabase.from('salons').select('id, lead_time_hours').eq('slug', salonId).maybeSingle();
        salonData = res.data;
      }

      if (salonData) {
        const leadHours = Number(salonData.lead_time_hours || 0);
        if (leadHours > 0 && appointment.date && appointment.time) {
          // Build a Date object for the requested slot (assume local time)
          const timeParts = String(appointment.time).split(':').map((p: string) => Number(p));
          const [hour = 0, minute = 0] = timeParts;
          const [y, m, d] = String(appointment.date).split('-').map(Number);
          const slotDate = new Date(y, (m || 1) - 1, d || 1, hour, minute || 0, 0);
          const now = new Date();
          const cutoff = new Date(now.getTime() + leadHours * 60 * 60 * 1000);
          if (slotDate.getTime() < cutoff.getTime()) {
            return { error: { message: `Salon vereist minimaal ${leadHours} uur van tevoren boeken` } };
          }
        }
      }
    }
  } catch (e) {
    // If lead-time check fails unexpectedly, continue to attempt insert (fail-open) but log the error
    console.error('Lead-time check failed:', e);
  }
  const attemptInsert = async (payload: Record<string, any>) => {
    // Preprocess the payload to ensure time is cast to time type if it exists
    const processedPayload = { ...payload };
    if (processedPayload.time && typeof processedPayload.time === 'string') {
      // Cast time string to time type for PostgreSQL
      processedPayload.time = processedPayload.time; // Keep as string, Supabase/PostgreSQL should handle casting
    }
    return await supabase.from('appointments').insert([processedPayload]);
  };

  // First, attempt the normal insert and inspect returned `error` if any
  try {
    const { error, data } = await attemptInsert(appointment);

    if (error) {
      const message = (error.message || error.msg || JSON.stringify(error)) as string;

      // Specific `service_name` pattern
      if (message.includes("Could not find the 'service_name'") || message.includes('service_name')) {
        const { service_name, serviceName, ...rest } = appointment as any;
        return await attemptInsert(rest);
      }

      const missingColumnMatch = message.match(/Could not find the '([a-zA-Z0-9_]+)' column/);
      if (missingColumnMatch) {
        const missing = missingColumnMatch[1];
        const { [missing]: _omitted, ...rest } = appointment as any;
        return await attemptInsert(rest);
      }

      // Unknown returned error
      return { error };
    }

    // Success
    return { error: null, data };
  } catch (err: any) {
    // Some clients throw errors instead of returning them; try same fallback logic
    const message = (err && (err.message || err.msg || JSON.stringify(err))) || '';

    if (message.includes("Could not find the 'service_name'") || message.includes('service_name')) {
      const { service_name, serviceName, ...rest } = appointment as any;
      try {
        const { error, data } = await supabase.from('appointments').insert([rest]);
        return { error, data };
      } catch (err2: any) {
        return { error: err2 };
      }
    }

    const missingColumnMatch = message.match(/Could not find the '([a-zA-Z0-9_]+)' column/);
    if (missingColumnMatch) {
      const missing = missingColumnMatch[1];
      const { [missing]: _omitted, ...rest } = appointment as any;
      try {
        const { error, data } = await supabase.from('appointments').insert([rest]);
        return { error, data };
      } catch (err3: any) {
        return { error: err3 };
      }
    }

    // Unknown error - return as error
    return { error: err };
  }
}
