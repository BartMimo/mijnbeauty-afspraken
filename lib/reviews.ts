import { supabase } from "./supabase";

/**
 * reviews.ts
 * Centrale laag voor Reviews (Supabase + RLS)
 *
 * Verwachte RLS policies:
 * - INSERT / UPDATE / DELETE:
 *     auth.uid() = user_id
 *
 * Minimale kolommen in `reviews`:
 * - id (uuid)
 * - salon_id (uuid)
 * - user_id (uuid)
 * - rating (number)
 * - comment (text)
 * - created_at (timestamp)
 */

export type ReviewRow = Record<string, any>;

export type CreateReviewInput = {
  salon_id: string;
  rating: number;
  comment?: string | null;
};

/* ================================
   Auth errors
================================ */

export class NotAuthenticatedError extends Error {
  constructor() {
    super("NOT_AUTHENTICATED");
    this.name = "NotAuthenticatedError";
  }
}

export function isNotAuthenticatedError(err: unknown): boolean {
  if (!err) return false;

  if (err instanceof NotAuthenticatedError) return true;

  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return (
      msg === "not_authenticated" ||
      msg.includes("permission") ||
      msg.includes("not authorized") ||
      msg.includes("jwt")
    );
  }

  return false;
}

/* ================================
   Create
================================ */

export async function insertReviewSafe(input: CreateReviewInput) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    return { data: null as ReviewRow | null, error: authError };
  }

  if (!user) {
    return { data: null as ReviewRow | null, error: new NotAuthenticatedError() };
  }

  const payload = {
    salon_id: input.salon_id,
    rating: input.rating,
    comment: input.comment ?? null,
    user_id: user.id,
  };

  const { data, error } = await supabase
    .from("reviews")
    .insert(payload)
    .select()
    .single();

  return { data: data as ReviewRow | null, error };
}

/* ================================
   Read
================================ */

export async function fetchSalonReviews(params: {
  salonId: string;
  limit?: number;
}) {
  const { salonId, limit = 50 } = params;

  const { data, error } = await supabase
    .from("reviews")
    .select("*, profiles!reviews_user_id_fkey(full_name)")
    .eq("salon_id", salonId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return { data, error };
}

/* ================================
   Update (eigen review)
================================ */

export async function updateReviewSafe(
  reviewId: string,
  patch: Partial<CreateReviewInput>
) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    return { data: null as ReviewRow | null, error: authError };
  }

  if (!user) {
    return { data: null as ReviewRow | null, error: new NotAuthenticatedError() };
  }

  const { data, error } = await supabase
    .from("reviews")
    .update(patch)
    .eq("id", reviewId)
    .select()
    .single();

  return { data: data as ReviewRow | null, error };
}

/* ================================
   Delete (eigen review)
================================ */

export async function deleteReviewSafe(reviewId: string) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) return { error: authError };
  if (!user) return { error: new NotAuthenticatedError() };

  const { error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId);

  return { error };
}