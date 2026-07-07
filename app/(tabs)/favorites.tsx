import { useCallback, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { BouncyPressable } from '@/components/bouncy-pressable';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Palette } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Favorite, listFavorites } from '@/lib/favorites';

export default function FavoritesScreen() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const router = useRouter();

  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const mutedColor = useThemeColor({}, 'muted');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      listFavorites().then((data) => {
        if (active) setFavorites(data);
      });
      return () => {
        active = false;
      };
    }, [])
  );

  const openFavorite = (favorite: Favorite) => {
    if (favorite.source === 'catalog') {
      router.push({ pathname: '/catalog/[id]', params: { id: String(favorite.recipeId) } });
    } else {
      router.push({ pathname: '/external/[id]', params: { id: String(favorite.recipeId) } });
    }
  };

  if (!user) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ThemedText style={styles.emoji}>🔑</ThemedText>
        <ThemedText type="title" style={styles.centerText}>
          Sign in to see favorites
        </ThemedText>
        <ThemedText style={[styles.centerText, { color: mutedColor }]}>
          Your saved recipes will show up here once you sign in with Google.
        </ThemedText>
        <BouncyPressable style={styles.signInButton} onPress={() => router.push('/modal')} testID="favorites-sign-in">
          <ThemedText style={styles.signInText}>Sign in</ThemedText>
        </BouncyPressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Favorites ❤️
      </ThemedText>

      {favorites.length === 0 ? (
        <ThemedView style={styles.center}>
          <ThemedText style={styles.emoji}>🤍</ThemedText>
          <ThemedText style={[styles.centerText, { color: mutedColor }]} testID="favorites-empty">
            No favorites yet. Tap the heart on a recipe to save it here.
          </ThemedText>
        </ThemedView>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 60)}>
              <BouncyPressable
                onPress={() => openFavorite(item)}
                testID={`favorite-card-${item.id}`}>
                <ThemedView style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.cardImage} contentFit="cover" />
                  ) : (
                    <ThemedView style={[styles.cardImage, styles.cardImageFallback]}>
                      <ThemedText style={styles.cardImageEmoji}>🍲</ThemedText>
                    </ThemedView>
                  )}
                  <ThemedView style={styles.cardInfo}>
                    <ThemedText type="defaultSemiBold" numberOfLines={2}>
                      {item.title}
                    </ThemedText>
                    <ThemedText style={[styles.cardMeta, { color: mutedColor }]}>
                      {item.source === 'catalog' ? '📖 From your kitchen' : '🌍 From the internet'}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
              </BouncyPressable>
            </Animated.View>
          )}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 64,
  },
  title: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 10,
  },
  centerText: {
    textAlign: 'center',
  },
  emoji: {
    fontSize: 44,
    lineHeight: 52,
  },
  signInButton: {
    backgroundColor: Palette.rose,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 8,
  },
  signInText: {
    color: '#fff',
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 140,
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    gap: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  cardImage: {
    width: 64,
    height: 64,
    borderRadius: 10,
  },
  cardImageFallback: {
    backgroundColor: Palette.pinkSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImageEmoji: {
    fontSize: 26,
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  cardMeta: {
    fontSize: 12,
  },
});
