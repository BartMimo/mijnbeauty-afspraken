import { supabase } from './supabase';

// Robust insert for `reviews` table. Some deployments may have different
// columns (older/newer schemas). Try a full insert first, then retry
// omitting columns mentioned in DB errors.
export async function insertReviewSafe(review: Record<string, any>) {
  const attemptInsert = async (payload: Record<string, any>) => {
    return await supabase.from('reviews').insert([payload]).select().single();
  };

  // Force anonymous reviews by clearing `user_id` so FK errors don't block inserts
  const basePayload = { ...review, user_id: null };
  try {
    const { error, data } = await attemptInsert(basePayload);
    if (error) {
      const message = (error.message || error.msg || JSON.stringify(error)) as string;

      // If DB complains about a missing column, drop it and retry
      // Try to detect any quoted column names mentioned in the error (covers variants like
      // "Could not find the 'is_approved' column of 'reviews' in the schema cache")
      const quotedMatches = Array.from(message.matchAll(/'([a-zA-Z0-9_]+)'/g)).map(m => m[1]);
      for (const maybeCol of quotedMatches) {
        if (maybeCol in basePayload) {
          const { [maybeCol]: _omitted, ...rest } = basePayload as any;
          return await attemptInsert(rest);
        }
      }

      // Fallback: try removing `user_id` or `salon_id` if present (common RLS issues)
      if (message.toLowerCase().includes('permission') || message.toLowerCase().includes('policy')) {
        const { user_id, salon_id, ...rest } = basePayload as any;
        return await attemptInsert(rest);
      }

      // Handle foreign key constraint violations (e.g. reviews_user_id_fkey)
      if (message.toLowerCase().includes('violates foreign key constraint') || /_fkey\b/.test(message)) {
        // If the constraint name mentions user_id or salon_id, drop that field and retry
        const lower = message.toLowerCase();
        if (lower.includes('user_id') || lower.includes('reviews_user_id_fkey')) {
          const { user_id, ...rest } = basePayload as any;
          return await attemptInsert(rest);
        }
        if (lower.includes('salon_id') || lower.includes('reviews_salon_id_fkey')) {
          const { salon_id, ...rest } = basePayload as any;
          return await attemptInsert(rest);
        }

        // Generic: try omitting user_id first, then salon_id
        if ('user_id' in basePayload) {
          const { user_id, ...rest } = basePayload as any;
          const r = await attemptInsert(rest);
          if (!r.error) return r;
        }
        if ('salon_id' in basePayload) {
          const { salon_id, ...rest } = basePayload as any;
          return await attemptInsert(rest);
        }
      }

      return { error };
    }

    return { error: null, data };
  } catch (err: any) {
    const message = (err && (err.message || err.msg || JSON.stringify(err))) || '';
    const quotedMatches = Array.from(message.matchAll(/'([a-zA-Z0-9_]+)'/g)).map(m => m[1]);
    for (const maybeCol of quotedMatches) {
      if (maybeCol in basePayload) {
        const { [maybeCol]: _omitted, ...rest } = basePayload as any;
        try {
          const { error, data } = await supabase.from('reviews').insert([rest]).select().single();
          return { error, data };
        } catch (err2: any) {
          return { error: err2 };
        }
      }
    }

    // Catch foreign key constraint violations and retry without the offending FK
    if (message.toLowerCase().includes('violates foreign key constraint') || /_fkey\b/.test(message)) {
      const lower = message.toLowerCase();
      if (lower.includes('user_id') || lower.includes('reviews_user_id_fkey')) {
        const { user_id, ...rest } = basePayload as any;
        try {
          const { error, data } = await supabase.from('reviews').insert([rest]).select().single();
          return { error, data };
        } catch (err4: any) {
          return { error: err4 };
        }
      }
      if (lower.includes('salon_id') || lower.includes('reviews_salon_id_fkey')) {
        const { salon_id, ...rest } = basePayload as any;
        try {
          const { error, data } = await supabase.from('reviews').insert([rest]).select().single();
          return { error, data };
        } catch (err5: any) {
          return { error: err5 };
        }
      }

      // Generic retry: try without user_id then without salon_id
      if ('user_id' in basePayload) {
        const { user_id, ...rest } = basePayload as any;
        try {
          const { error, data } = await supabase.from('reviews').insert([rest]).select().single();
          if (!error) return { error: null, data };
        } catch (err6: any) {
          // continue
        }
      }
      if ('salon_id' in basePayload) {
        const { salon_id, ...rest } = basePayload as any;
        try {
          const { error, data } = await supabase.from('reviews').insert([rest]).select().single();
          return { error, data };
        } catch (err7: any) {
          return { error: err7 };
        }
      }
    }

    if (message.toLowerCase().includes('permission') || message.toLowerCase().includes('policy')) {
      const { user_id, salon_id, ...rest } = basePayload as any;
      try {
        const { error, data } = await supabase.from('reviews').insert([rest]).select().single();
        return { error, data };
      } catch (err3: any) {
        return { error: err3 };
      }
    }

    return { error: err };
  }
}
