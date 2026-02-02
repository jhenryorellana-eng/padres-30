import { getSupabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

export interface AppRating {
  id: string;
  miniAppId: string;
  profileId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppStats {
  totalRatings: number;
  averageRating: number;
  totalComments: number;
}

export interface AppReviewWithUser {
  id: string;
  miniAppId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  userName: string;
}

export interface RatingBreakdown {
  fiveStar: number;
  fourStar: number;
  threeStar: number;
  twoStar: number;
  oneStar: number;
  total: number;
}

/**
 * Obtener estadísticas de una app
 */
export async function getAppStats(miniAppId: string): Promise<AppStats | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('mini_app_stats')
    .select('*')
    .eq('mini_app_id', miniAppId)
    .single();

  if (error) {
    // Si no hay datos, retornar stats vacías
    if (error.code === 'PGRST116') {
      return {
        totalRatings: 0,
        averageRating: 0,
        totalComments: 0,
      };
    }
    console.error('Error fetching app stats:', error);
    return null;
  }

  return {
    totalRatings: data.total_ratings || 0,
    averageRating: parseFloat(data.average_rating) || 0,
    totalComments: data.total_comments || 0,
  };
}

/**
 * Obtener las últimas reseñas de una app
 */
export async function getAppReviews(
  miniAppId: string,
  limit: number = 10
): Promise<AppReviewWithUser[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('mini_app_ratings')
    .select('id, mini_app_id, rating, comment, created_at, profile_id, reviewer_name')
    .eq('mini_app_id', miniAppId)
    .not('comment', 'is', null)
    .neq('comment', '')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching app reviews:', error);
    return [];
  }

  // Mapear los datos - usar nombre real si existe, sino fallback anónimo
  return (data || []).map((row) => ({
    id: row.id,
    miniAppId: row.mini_app_id,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
    // Usar nombre real del estudiante si existe, sino fallback a UUID truncado
    userName: row.reviewer_name || `Usuario ${row.profile_id.slice(0, 4).toUpperCase()}`,
  }));
}

/**
 * Obtener la calificación del usuario actual
 */
export async function getUserRating(
  miniAppId: string
): Promise<AppRating | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  // Usar authStore en vez de supabase.auth.getUser() para evitar caché desincronizado
  const authUser = useAuthStore.getState().user;
  if (!authUser) return null;

  const { data, error } = await supabase
    .from('mini_app_ratings')
    .select('*')
    .eq('mini_app_id', miniAppId)
    .eq('profile_id', authUser.id)
    .single();

  if (error) {
    // No rating found is not an error
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching user rating:', error);
    return null;
  }

  return {
    id: data.id,
    miniAppId: data.mini_app_id,
    profileId: data.profile_id,
    rating: data.rating,
    comment: data.comment,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Guardar/actualizar calificación
 */
export async function saveRating(
  miniAppId: string,
  rating: number,
  comment?: string
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  // Usar authStore en vez de supabase.auth.getUser() para evitar caché desincronizado
  const authUser = useAuthStore.getState().user;
  if (!authUser) {
    console.error('User not authenticated');
    return false;
  }

  // Validate rating
  if (rating < 0 || rating > 5) {
    console.error('Invalid rating value:', rating);
    return false;
  }

  const { error } = await supabase.from('mini_app_ratings').upsert(
    {
      mini_app_id: miniAppId,
      profile_id: authUser.id,
      rating,
      comment: comment || null,
      // Guardar el nombre del padre para mostrarlo en las reseñas
      reviewer_name: authUser.firstName || authUser.fullName || 'Padre',
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'mini_app_id,profile_id',
    }
  );

  if (error) {
    console.error('Error saving rating:', error);
    return false;
  }

  return true;
}

/**
 * Obtener el breakdown de estrellas de una app
 */
export async function getRatingBreakdown(
  miniAppId: string
): Promise<RatingBreakdown | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('mini_app_rating_breakdown')
    .select('*')
    .eq('mini_app_id', miniAppId)
    .single();

  if (error) {
    // Si no hay datos, retornar breakdown vacío
    if (error.code === 'PGRST116') {
      return {
        fiveStar: 0,
        fourStar: 0,
        threeStar: 0,
        twoStar: 0,
        oneStar: 0,
        total: 0,
      };
    }
    console.error('Error fetching rating breakdown:', error);
    return null;
  }

  return {
    fiveStar: data.five_star || 0,
    fourStar: data.four_star || 0,
    threeStar: data.three_star || 0,
    twoStar: data.two_star || 0,
    oneStar: data.one_star || 0,
    total: data.total || 0,
  };
}

/**
 * Eliminar la calificación del usuario actual
 */
export async function deleteRating(miniAppId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  // Usar authStore en vez de supabase.auth.getUser() para evitar caché desincronizado
  const authUser = useAuthStore.getState().user;
  if (!authUser) return false;

  const { error } = await supabase
    .from('mini_app_ratings')
    .delete()
    .eq('mini_app_id', miniAppId)
    .eq('profile_id', authUser.id);

  if (error) {
    console.error('Error deleting rating:', error);
    return false;
  }

  return true;
}
