import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import colors from '@/constants/colors';
import { fontFamilies, fontSizes } from '@/constants/typography';
import { Button } from '@/components/ui';
import { getMiniAppById, type MiniApp } from '@/constants/miniApps';
import {
  getAppStats,
  getAppReviews,
  getUserRating,
  saveRating,
  getRatingBreakdown,
  type AppStats,
  type AppReviewWithUser,
  type AppRating,
  type RatingBreakdown,
} from '@/services/ratingsService';

const ICON_SIZE = 72;

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'hace un momento';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return diffInMinutes === 1 ? 'hace 1 minuto' : `hace ${diffInMinutes} minutos`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return diffInHours === 1 ? 'hace 1 hora' : `hace ${diffInHours} horas`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return diffInDays === 1 ? 'hace 1 día' : `hace ${diffInDays} días`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return diffInWeeks === 1 ? 'hace 1 semana' : `hace ${diffInWeeks} semanas`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return diffInMonths === 1 ? 'hace 1 mes' : `hace ${diffInMonths} meses`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return diffInYears === 1 ? 'hace 1 año' : `hace ${diffInYears} años`;
}

// Header con icono y nombre de la app
function AppHeader({ app }: { app: MiniApp }) {
  return (
    <View style={styles.headerContainer}>
      <LinearGradient
        colors={[app.gradient.from, app.gradient.to]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconContainer}
      >
        <View style={styles.iconOverlay} />
        <MaterialIcons
          name={app.icon as keyof typeof MaterialIcons.glyphMap}
          size={36}
          color={colors.textLight}
        />
      </LinearGradient>
      <View style={styles.headerTextContainer}>
        <Text style={styles.appName}>{app.name}</Text>
        <Text style={styles.appShortDesc} numberOfLines={2}>
          {app.description}
        </Text>
      </View>
    </View>
  );
}

// Componente de estrellas para mostrar rating
function StarDisplay({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <View style={styles.starDisplayContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <MaterialIcons
          key={star}
          name={star <= rating ? 'star' : star - 0.5 <= rating ? 'star-half' : 'star-border'}
          size={size}
          color={colors.badgeGold}
        />
      ))}
    </View>
  );
}

// Barra de progreso para cada nivel de estrellas
function RatingBar({ stars, count, total }: { stars: number; count: number; total: number }) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <View style={styles.ratingBarContainer}>
      <Text style={styles.ratingBarLabel}>{stars}</Text>
      <MaterialIcons name="star" size={12} color={colors.textTertiary} />
      <View style={styles.ratingBarTrack}>
        <View style={[styles.ratingBarFill, { width: `${percentage}%` }]} />
      </View>
      <Text style={styles.ratingBarPercent}>
        {total > 0 ? `${Math.round(percentage)}%` : '-'}
      </Text>
    </View>
  );
}

// Seccion de resumen de rating con breakdown
function RatingSummarySection({
  stats,
  breakdown,
}: {
  stats: AppStats | null;
  breakdown: RatingBreakdown | null;
}) {
  if (!stats) return null;

  return (
    <View style={styles.ratingSummarySection}>
      <View style={styles.ratingSummaryLeft}>
        <Text style={styles.ratingBigNumber}>
          {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '-'}
        </Text>
        <StarDisplay rating={Math.round(stats.averageRating)} size={18} />
        <Text style={styles.ratingTotalText}>
          ({stats.totalRatings} {stats.totalRatings === 1 ? 'reseña' : 'reseñas'})
        </Text>
      </View>

      <View style={styles.ratingSummaryRight}>
        <RatingBar stars={5} count={breakdown?.fiveStar || 0} total={breakdown?.total || 0} />
        <RatingBar stars={4} count={breakdown?.fourStar || 0} total={breakdown?.total || 0} />
        <RatingBar stars={3} count={breakdown?.threeStar || 0} total={breakdown?.total || 0} />
        <RatingBar stars={2} count={breakdown?.twoStar || 0} total={breakdown?.total || 0} />
        <RatingBar stars={1} count={breakdown?.oneStar || 0} total={breakdown?.total || 0} />
      </View>
    </View>
  );
}

// Seccion interactiva para calificar
function RateAppSection({
  userRating,
  selectedRating,
  comment,
  isSaving,
  onRatingChange,
  onCommentChange,
  onSubmit,
}: {
  userRating: AppRating | null;
  selectedRating: number;
  comment: string;
  isSaving: boolean;
  onRatingChange: (rating: number) => void;
  onCommentChange: (comment: string) => void;
  onSubmit: () => void;
}) {
  const hasUserRated = userRating !== null;
  const canSubmit = selectedRating > 0 && !isSaving;
  const showCommentInput = selectedRating > 0;

  return (
    <View style={styles.rateAppSection}>
      <Text style={styles.rateAppTitle}>
        {hasUserRated ? 'Tu calificación' : 'Califica esta app'}
      </Text>

      <View style={styles.interactiveStarsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onRatingChange(star)}
            style={styles.interactiveStarButton}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name={star <= selectedRating ? 'star' : 'star-border'}
              size={40}
              color={star <= selectedRating ? colors.badgeGold : colors.textTertiary}
            />
          </TouchableOpacity>
        ))}
      </View>

      {selectedRating > 0 && (
        <Text style={styles.ratingHintText}>
          {selectedRating === 1 && 'Muy mala'}
          {selectedRating === 2 && 'Mala'}
          {selectedRating === 3 && 'Regular'}
          {selectedRating === 4 && 'Buena'}
          {selectedRating === 5 && 'Excelente'}
        </Text>
      )}

      {showCommentInput && (
        <>
          <TextInput
            style={styles.commentInput}
            placeholder="Escribe un comentario (opcional)"
            placeholderTextColor={colors.textTertiary}
            value={comment}
            onChangeText={onCommentChange}
            multiline
            numberOfLines={3}
            maxLength={500}
          />

          <TouchableOpacity
            style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
            onPress={onSubmit}
            disabled={!canSubmit}
            activeOpacity={0.8}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.textLight} />
            ) : (
              <Text style={styles.submitButtonText}>
                {hasUserRated ? 'Actualizar calificación' : 'Enviar calificación'}
              </Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

// Seccion Acerca de
function AboutSection({ description }: { description: string }) {
  return (
    <View style={styles.aboutSection}>
      <Text style={styles.sectionTitle}>Acerca de esta app</Text>
      <Text style={styles.aboutDescription}>{description}</Text>
    </View>
  );
}

// Item de reseña individual
function ReviewItem({ review }: { review: AppReviewWithUser }) {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewAvatar}>
          <Text style={styles.reviewAvatarText}>
            {review.userName.charAt(review.userName.length - 4)}
          </Text>
        </View>
        <View style={styles.reviewInfo}>
          <Text style={styles.reviewName}>{review.userName}</Text>
          <Text style={styles.reviewDate}>{formatTimeAgo(review.createdAt)}</Text>
        </View>
      </View>
      <StarDisplay rating={review.rating} size={14} />
      {review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}
    </View>
  );
}

// Seccion de reseñas
function ReviewsSection({
  reviews,
  totalComments,
}: {
  reviews: AppReviewWithUser[];
  totalComments: number;
}) {
  return (
    <View style={styles.reviewsSection}>
      <Text style={styles.sectionTitle}>Reseñas y opiniones ({totalComments})</Text>

      {reviews.length > 0 ? (
        reviews.map((review) => <ReviewItem key={review.id} review={review} />)
      ) : (
        <View style={styles.noReviewsContainer}>
          <MaterialIcons name="rate-review" size={40} color={colors.textTertiary} />
          <Text style={styles.noReviewsText}>
            Aún no hay reseñas.{'\n'}¡Sé el primero en comentar!
          </Text>
        </View>
      )}
    </View>
  );
}

// Pantalla de app no encontrada
function NotFoundScreen() {
  const router = useRouter();

  return (
    <View style={styles.notFoundContainer}>
      <MaterialIcons name="error-outline" size={64} color={colors.textTertiary} />
      <Text style={styles.notFoundText}>App no encontrada</Text>
      <TouchableOpacity style={styles.notFoundButton} onPress={() => router.back()}>
        <Text style={styles.notFoundButtonText}>Volver</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function AppInfoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const app = getMiniAppById(id || '');

  // Estado para los datos de la API
  const [stats, setStats] = useState<AppStats | null>(null);
  const [breakdown, setBreakdown] = useState<RatingBreakdown | null>(null);
  const [reviews, setReviews] = useState<AppReviewWithUser[]>([]);
  const [userRating, setUserRating] = useState<AppRating | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Estado para el formulario de calificacion
  const [selectedRating, setSelectedRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (app) {
      loadData();
    }
  }, [app]);

  const loadData = async () => {
    if (!app) return;

    setIsLoading(true);
    try {
      const [statsData, breakdownData, reviewsData, userRatingData] = await Promise.all([
        getAppStats(app.id),
        getRatingBreakdown(app.id),
        getAppReviews(app.id, 5),
        getUserRating(app.id),
      ]);

      setStats(statsData);
      setBreakdown(breakdownData);
      setReviews(reviewsData);
      setUserRating(userRatingData);

      if (userRatingData) {
        setSelectedRating(userRatingData.rating);
        setComment(userRatingData.comment || '');
      }
    } catch (error) {
      console.error('Error loading app data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitRating = async () => {
    if (!app || selectedRating === 0) return;

    setIsSaving(true);
    try {
      const success = await saveRating(app.id, selectedRating, comment);
      if (success) {
        await loadData();
      }
    } catch (error) {
      console.error('Error saving rating:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenApp = () => {
    if (app) {
      router.push(`/miniapp/${app.id}`);
    }
  };

  if (!app) {
    return <NotFoundScreen />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: app.name,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontFamily: fontFamilies.semiBold },
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scrollContentContainer, { paddingBottom: insets.bottom + 80 }]}
      >
        {/* Header con icono y nombre */}
        <AppHeader app={app} />

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Cargando información...</Text>
          </View>
        ) : (
          <>
            {/* Rating Summary + Breakdown */}
            <RatingSummarySection stats={stats} breakdown={breakdown} />

            {/* Sección para calificar */}
            <RateAppSection
              userRating={userRating}
              selectedRating={selectedRating}
              comment={comment}
              isSaving={isSaving}
              onRatingChange={setSelectedRating}
              onCommentChange={setComment}
              onSubmit={handleSubmitRating}
            />

            {/* Acerca de */}
            <AboutSection description={app.description} />

            {/* Reseñas */}
            <ReviewsSection reviews={reviews} totalComments={stats?.totalComments || 0} />
          </>
        )}
      </ScrollView>

      {/* Botón fijo en la parte inferior */}
      <View style={[styles.buttonContainer, { paddingBottom: insets.bottom + 16 }]}>
        <Button title="Abrir" onPress={handleOpenApp} fullWidth />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 16,
  },

  // Not found
  notFoundContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  notFoundText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
    marginTop: 16,
    marginBottom: 24,
  },
  notFoundButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  notFoundButtonText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: fontSizes.base,
    color: colors.textLight,
  },

  // Header styles
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconContainer: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  iconOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  appName: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.xl,
    color: colors.text,
    marginBottom: 4,
  },
  appShortDesc: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: fontSizes.sm * 1.4,
  },

  // Loading
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: 12,
  },

  // Rating summary section
  ratingSummarySection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  ratingSummaryLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 20,
    minWidth: 100,
  },
  ratingBigNumber: {
    fontFamily: fontFamilies.bold,
    fontSize: 48,
    color: colors.text,
    lineHeight: 52,
  },
  starDisplayContainer: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  ratingTotalText: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 4,
  },
  ratingSummaryRight: {
    flex: 1,
    justifyContent: 'center',
  },

  // Rating bar
  ratingBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  ratingBarLabel: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    width: 12,
    textAlign: 'center',
  },
  ratingBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.card,
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  ratingBarPercent: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.xs,
    color: colors.textTertiary,
    width: 32,
    textAlign: 'right',
  },

  // Rate app section
  rateAppSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rateAppTitle: {
    fontFamily: fontFamilies.semiBold,
    fontSize: fontSizes.base,
    color: colors.text,
    marginBottom: 12,
  },
  interactiveStarsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  interactiveStarButton: {
    padding: 4,
  },
  ratingHintText: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.sm,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  commentInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.base,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: fontSizes.base,
    color: colors.textLight,
  },

  // About section
  aboutSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontFamily: fontFamilies.semiBold,
    fontSize: fontSizes.base,
    color: colors.text,
    marginBottom: 12,
  },
  aboutDescription: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    lineHeight: fontSizes.base * 1.6,
  },

  // Reviews section
  reviewsSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  // Review card
  reviewCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  reviewAvatarText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.sm,
    color: colors.textLight,
    textTransform: 'uppercase',
  },
  reviewInfo: {
    flex: 1,
  },
  reviewName: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.sm,
    color: colors.text,
  },
  reviewDate: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },
  reviewComment: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: fontSizes.sm * 1.5,
    marginTop: 8,
  },

  // No reviews
  noReviewsContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noReviewsText: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: fontSizes.sm * 1.5,
  },

  // Button container
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
