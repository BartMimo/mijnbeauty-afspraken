import { supabase } from './supabase';

// Insert appointment robustly. Some deployments may have different columns present.
// Strategy: try the full insert, and if the DB complains about a missing column
// (e.g., `service_name`), retry without that column.
export async function insertAppointmentSafe(appointment: Record<string, any>) {
  try {
    const { error, data } = await supabase.from('appointments').insert([appointment]);
    return { error, data };
  } catch (err: any) {
    const message = (err && (err.message || err.msg || JSON.stringify(err))) || '';

    // Known missing-column pattern from Supabase/Postgres: "Could not find the 'xxx' column"
    if (message.includes("Could not find the 'service_name'") || message.includes('service_name')) {
      // Retry without service_name
      const { service_name, serviceName, ...rest } = appointment as any;
      try {
        const { error, data } = await supabase.from('appointments').insert([rest]);
        return { error, data };
      } catch (err2: any) {
        return { error: err2 }; // propagate second error
      }
    }

    // If the message includes other missing column hints, we can attempt a generic fallback:
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
