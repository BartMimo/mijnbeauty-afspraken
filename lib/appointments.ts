import { supabase } from './supabase';

// Insert appointment robustly. Some deployments may have different columns present.
// Strategy: try the full insert, and if the DB complains about a missing column
// (e.g., `service_name`), retry without that column. We need to handle both
// - the Supabase client returning an `error` object, and
// - the client throwing an exception.
export async function insertAppointmentSafe(appointment: Record<string, any>) {
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
