import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Palette } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { fetchRecipeDetail, RecipeDetail } from '@/lib/api';

const DIET_LABEL: Record<RecipeDetail['diet'], string> = {
  vegan: '🌱 Vegan',
  vegetarian: '🥚 Vegetarian',
  mit_meat: '🥩 With meat',
};

export default function CatalogRecipeScreen() {
  const { id, matched, missing } = useLocalSearchParams<{
    id: string;
    matched?: string;
    missing?: string;
  }>();
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const mutedColor = useThemeColor({}, 'muted');
  const borderColor = useThemeColor({}, 'border');

  const matchedSet = new Set((matched ?? '').split(',').filter(Boolean));
  const missingSet = new Set((missing ?? '').split(',').filter(Boolean));

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoaded(false);
      setError(null);
      fetchRecipeDetail(Number(id))
        .then((data) => {
          if (active) setRecipe(data);
        })
        .catch((e) => {
          if (active) setError(e instanceof Error ? e.message : 'Could not load this recipe.');
        })
        .finally(() => {
          if (active) setLoaded(true);
        });
      return () => {
        active = false;
      };
    }, [id])
  );

  if (!loaded) {
    return (
      <ThemedView style={styles.center}>
        <Stack.Screen options={{ title: 'Recipe' }} />
        <ActivityIndicator color={Palette.rose} />
      </ThemedView>
    );
  }

  if (error || !recipe) {
    return (
      <ThemedView style={styles.center}>
        <Stack.Screen options={{ title: 'Recipe' }} />
        <ThemedText testID="catalog-recipe-error">
          {error ?? 'This recipe no longer exists.'}
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: recipe.title }} />
      <ScrollView contentContainerStyle={styles.container}>
        <ThemedText type="title">{recipe.title}</ThemedText>
        <ThemedText style={[styles.meta, { color: mutedColor }]}>
          {DIET_LABEL[recipe.diet]}
        </ThemedText>

        <ThemedText type="subtitle" style={styles.section}>
          Ingredients
        </ThemedText>
        {recipe.ingredients.map((ingredient, index) => {
          const have = matchedSet.has(ingredient.name);
          const need = missingSet.has(ingredient.name);
          return (
            <ThemedText key={index}>
              {have ? '✅ ' : need ? '🛒 ' : '• '}
              {ingredient.name}
              {ingredient.quantity ? ` — ${ingredient.quantity}` : ''}
            </ThemedText>
          );
        })}

        <ThemedText type="subtitle" style={styles.section}>
          Instructions
        </ThemedText>
        <ThemedText>{recipe.instructions}</ThemedText>

        <ThemedView style={[styles.hintBox, { borderColor }]}>
          <ThemedText style={[styles.hintText, { color: mutedColor }]}>
            📖 This is a catalog recipe — save your own version from the «My recipes» tab if you
            want to edit it.
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 6,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    fontSize: 14,
  },
  section: {
    marginTop: 16,
  },
  hintBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 12,
    marginTop: 24,
  },
  hintText: {
    fontSize: 13,
  },
});
