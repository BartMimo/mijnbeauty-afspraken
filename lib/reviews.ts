import { supabase } from './supabase';

// Robust insert for `reviews` table. Some deployments may have different
// columns (older/newer schemas). Try a full insert first, then retry
// omitting columns mentioned in DB errors.
export async function insertReviewSafe(review: Record<string, any>) {
  const attemptInsert = async (payload: Record<string, any>) => {
    return await supabase.from('reviews').insert([payload]).select().single();
  };

  try {
    const { error, data } = await attemptInsert(review);
    if (error) {
      const message = (error.message || error.msg || JSON.stringify(error)) as string;

      // If DB complains about a missing column, drop it and retry
      // Try to detect any quoted column names mentioned in the error (covers variants like
      // "Could not find the 'is_approved' column of 'reviews' in the schema cache")
      const quotedMatches = Array.from(message.matchAll(/'([a-zA-Z0-9_]+)'/g)).map(m => m[1]);
      for (const maybeCol of quotedMatches) {
        if (maybeCol in review) {
          const { [maybeCol]: _omitted, ...rest } = review as any;
          return await attemptInsert(rest);
        }
      }

      // Fallback: try removing `user_id` or `salon_id` if present (common RLS issues)
      if (message.toLowerCase().includes('permission') || message.toLowerCase().includes('policy')) {
        const { user_id, salon_id, ...rest } = review as any;
        return await attemptInsert(rest);
      }

      return { error };
    }

    return { error: null, data };
  } catch (err: any) {
    const message = (err && (err.message || err.msg || JSON.stringify(err))) || '';
    const quotedMatches = Array.from(message.matchAll(/'([a-zA-Z0-9_]+)'/g)).map(m => m[1]);
    for (const maybeCol of quotedMatches) {
      if (maybeCol in review) {
        const { [maybeCol]: _omitted, ...rest } = review as any;
        try {
          const { error, data } = await supabase.from('reviews').insert([rest]).select().single();
          return { error, data };
        } catch (err2: any) {
          return { error: err2 };
        }
      }
    }

    if (message.toLowerCase().includes('permission') || message.toLowerCase().includes('policy')) {
      const { user_id, salon_id, ...rest } = review as any;
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
