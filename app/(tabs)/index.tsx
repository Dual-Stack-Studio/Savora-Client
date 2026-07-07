import { useCallback, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { BouncyPressable } from '@/components/bouncy-pressable';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Palette } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { listRecipes, Recipe } from '@/lib/recipes';

export default function RecipesScreen() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const router = useRouter();
  const { user } = useAuth();

  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const mutedColor = useThemeColor({}, 'muted');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      listRecipes().then((data) => {
        if (active) setRecipes(data);
      });
      return () => {
        active = false;
      };
    }, [])
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">My recipes 📖</ThemedText>
        <BouncyPressable
          style={styles.addButton}
          onPress={() => router.push(user ? '/recipe/new' : '/modal')}
          testID="add-recipe">
          <ThemedText style={styles.addButtonText}>+ New</ThemedText>
        </BouncyPressable>
      </ThemedView>

      {recipes.length === 0 ? (
        <ThemedView style={styles.empty}>
          <ThemedText style={styles.emptyEmoji}>🍰</ThemedText>
          <ThemedText style={[styles.emptyText, { color: mutedColor }]} testID="empty-state">
            No recipes yet.{'\n'}Create your first one with the «+ New» button.
          </ThemedText>
        </ThemedView>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 70).springify()}>
              <BouncyPressable
                onPress={() => router.push({ pathname: '/recipe/[id]', params: { id: item.id } })}
                testID={`recipe-card-${item.id}`}>
                <ThemedView
                  style={[styles.card, { backgroundColor: cardColor, borderColor }]}
                  lightColor={cardColor}
                  darkColor={cardColor}>
                  <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
                  <ThemedText style={[styles.cardMeta, { color: mutedColor }]}>
                    🧂 {item.ingredients.length} ingredient{item.ingredients.length === 1 ? '' : 's'} ·{' '}
                    🍽️ {item.servings} serving{item.servings === 1 ? '' : 's'}
                  </ThemedText>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  addButton: {
    backgroundColor: Palette.rose,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    shadowColor: Palette.chocolate,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 140,
  },
  card: {
    borderRadius: 14,
    padding: 14,
    gap: 4,
    borderWidth: 1,
    marginBottom: 10,
  },
  cardMeta: {
    fontSize: 14,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 48,
    lineHeight: 56,
  },
  emptyText: {
    textAlign: 'center',
  },
});
