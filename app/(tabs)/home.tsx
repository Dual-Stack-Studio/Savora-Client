import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { BouncyPressable } from '@/components/bouncy-pressable';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Palette } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { fetchNews, NewsArticle } from '@/lib/api';

const SCREEN_WIDTH = Dimensions.get('window').width;
const HERO_WIDTH = Math.min(SCREEN_WIDTH - 32, 560);
const HERO_GAP = 12;
const AUTO_ADVANCE_MS = 5000;

export default function HomeScreen() {
  const [food, setFood] = useState<NewsArticle[]>([]);
  const [health, setHealth] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [heroIndex, setHeroIndex] = useState(0);

  const heroRef = useRef<FlatList<NewsArticle>>(null);
  const router = useRouter();
  const { user } = useAuth();
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const mutedColor = useThemeColor({}, 'muted');

  const load = useCallback(async () => {
    setError(null);
    try {
      // Los dos tópicos en paralelo; si uno falla, el otro se muestra igual.
      const [foodResult, healthResult] = await Promise.allSettled([
        fetchNews('food'),
        fetchNews('health'),
      ]);
      if (foodResult.status === 'fulfilled') setFood(foodResult.value.slice(0, 8));
      if (healthResult.status === 'fulfilled') setHealth(healthResult.value.slice(0, 10));
      if (foodResult.status === 'rejected' && healthResult.status === 'rejected') {
        throw foodResult.reason;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the news.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-avance del carrusel principal
  useEffect(() => {
    if (food.length < 2) return;
    const timer = setInterval(() => {
      setHeroIndex((current) => {
        const next = (current + 1) % food.length;
        heroRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [food.length]);

  const onHeroScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / (HERO_WIDTH + HERO_GAP));
    setHeroIndex(Math.max(0, Math.min(index, food.length - 1)));
  };

  const openArticle = (article: NewsArticle) => {
    WebBrowser.openBrowserAsync(article.link);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={Palette.rose}
          />
        }>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <ThemedText type="title">Hello, chef! 👋</ThemedText>
            <ThemedText style={[styles.subtitle, { color: mutedColor }]}>
              Fresh food & health news to get you inspired.
            </ThemedText>
          </View>
          <BouncyPressable
            style={[styles.accountButton, { borderColor }]}
            onPress={() => router.push('/modal')}
            testID="account-button">
            {user?.picture ? (
              <Image source={{ uri: user.picture }} style={styles.avatar} />
            ) : (
              <ThemedText style={styles.accountIcon}>{user ? '👤' : '🔑'}</ThemedText>
            )}
          </BouncyPressable>
        </View>

        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={Palette.rose} size="large" />
          </View>
        )}

        {error && !loading && (
          <View style={styles.errorBox}>
            <ThemedText style={styles.errorText}>😵 {error}</ThemedText>
            <ThemedText style={[styles.errorHint, { color: mutedColor }]}>
              Is the backend running with NEWSDATA_API_KEY set in its .env?
            </ThemedText>
          </View>
        )}

        {/* Hero: noticias de comida */}
        {food.length > 0 && (
          <>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Food news 🍞
            </ThemedText>
            <FlatList
              ref={heroRef}
              data={food}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={HERO_WIDTH + HERO_GAP}
              decelerationRate="fast"
              onMomentumScrollEnd={onHeroScrollEnd}
              getItemLayout={(_, index) => ({
                length: HERO_WIDTH + HERO_GAP,
                offset: (HERO_WIDTH + HERO_GAP) * index,
                index,
              })}
              contentContainerStyle={{ gap: HERO_GAP }}
              renderItem={({ item, index }) => (
                <Animated.View entering={FadeInDown.delay(Math.min(index, 4) * 80)}>
                  <BouncyPressable
                    style={[styles.heroCard, { borderColor }]}
                    onPress={() => openArticle(item)}
                    testID={`news-hero-${item.id}`}>
                    {item.image ? (
                      <Image source={{ uri: item.image }} style={styles.heroImage} contentFit="cover" />
                    ) : (
                      <View style={[styles.heroImage, styles.heroImageFallback]}>
                        <ThemedText style={styles.heroImageEmoji}>🍲</ThemedText>
                      </View>
                    )}
                    <View style={styles.heroOverlay}>
                      <ThemedText style={styles.heroTitle} numberOfLines={2}>
                        {item.title}
                      </ThemedText>
                      {item.source && (
                        <ThemedText style={styles.heroSource} numberOfLines={1}>
                          {item.source}
                        </ThemedText>
                      )}
                    </View>
                  </BouncyPressable>
                </Animated.View>
              )}
            />
            {/* Puntitos indicadores */}
            <View style={styles.dots}>
              {food.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === heroIndex ? styles.dotActive : { backgroundColor: borderColor }]}
                />
              ))}
            </View>
          </>
        )}

        {/* Carrusel secundario: salud */}
        {health.length > 0 && (
          <>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Health & nutrition 🥦
            </ThemedText>
            <FlatList
              data={health}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.healthList}
              renderItem={({ item, index }) => (
                <Animated.View entering={FadeInDown.delay(Math.min(index, 5) * 60)}>
                  <BouncyPressable
                    style={[styles.healthCard, { backgroundColor: cardColor, borderColor }]}
                    onPress={() => openArticle(item)}
                    testID={`news-health-${item.id}`}>
                    {item.image ? (
                      <Image source={{ uri: item.image }} style={styles.healthImage} contentFit="cover" />
                    ) : (
                      <View style={[styles.healthImage, styles.heroImageFallback]}>
                        <ThemedText style={styles.heroImageEmoji}>🥗</ThemedText>
                      </View>
                    )}
                    <View style={styles.healthInfo}>
                      <ThemedText type="defaultSemiBold" numberOfLines={3} style={styles.healthTitle}>
                        {item.title}
                      </ThemedText>
                      {item.source && (
                        <ThemedText style={[styles.healthSource, { color: mutedColor }]} numberOfLines={1}>
                          {item.source}
                        </ThemedText>
                      )}
                    </View>
                  </BouncyPressable>
                </Animated.View>
              )}
            />
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 64,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 140,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  accountButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  accountIcon: {
    fontSize: 20,
  },
  loadingBox: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  errorBox: {
    backgroundColor: '#FDECEC',
    borderRadius: 12,
    padding: 14,
    gap: 4,
    marginTop: 16,
  },
  errorText: {
    color: Palette.danger,
    fontWeight: '600',
  },
  errorHint: {
    fontSize: 13,
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 10,
  },
  heroCard: {
    width: HERO_WIDTH,
    height: 200,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroImageFallback: {
    backgroundColor: Palette.pinkSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImageEmoji: {
    fontSize: 44,
    lineHeight: 52,
  },
  heroOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(43, 24, 16, 0.72)',
    padding: 12,
    gap: 2,
  },
  heroTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    lineHeight: 20,
  },
  heroSource: {
    color: Palette.pinkSoft,
    fontSize: 12,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: Palette.rose,
    width: 18,
  },
  healthList: {
    gap: 10,
  },
  healthCard: {
    width: 220,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  healthImage: {
    width: '100%',
    height: 110,
  },
  healthInfo: {
    padding: 10,
    gap: 4,
  },
  healthTitle: {
    fontSize: 14,
    lineHeight: 19,
  },
  healthSource: {
    fontSize: 12,
  },
});
