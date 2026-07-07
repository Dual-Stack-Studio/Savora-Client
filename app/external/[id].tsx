import { useCallback, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';

import { BouncyPressable } from '@/components/bouncy-pressable';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Palette } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ExternalRecipeDetail, fetchExternalRecipeDetail } from '@/lib/api';

export default function ExternalRecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [recipe, setRecipe] = useState<ExternalRecipeDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const mutedColor = useThemeColor({}, 'muted');
  const borderColor = useThemeColor({}, 'border');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoaded(false);
      setError(null);
      fetchExternalRecipeDetail(Number(id))
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
        <ThemedText testID="external-recipe-error">
          {error ?? 'This recipe no longer exists.'}
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: recipe.title }} />
      <ScrollView contentContainerStyle={styles.container}>
        {recipe.image && (
          <Image source={{ uri: recipe.image }} style={styles.image} contentFit="cover" />
        )}
        <ThemedText type="title">{recipe.title}</ThemedText>
        {(recipe.servings || recipe.readyInMinutes) && (
          <ThemedText style={[styles.meta, { color: mutedColor }]}>
            {recipe.servings ? `🍽️ ${recipe.servings} serving${recipe.servings === 1 ? '' : 's'}` : ''}
            {recipe.servings && recipe.readyInMinutes ? ' · ' : ''}
            {recipe.readyInMinutes ? `⏱️ ${recipe.readyInMinutes} min` : ''}
          </ThemedText>
        )}

        <ThemedText type="subtitle" style={styles.section}>
          Ingredients
        </ThemedText>
        {recipe.ingredients.length === 0 ? (
          <ThemedText style={{ color: mutedColor }}>No ingredient details from Spoonacular.</ThemedText>
        ) : (
          recipe.ingredients.map((ingredient, index) => (
            <ThemedText key={index}>• {ingredient.original}</ThemedText>
          ))
        )}

        <ThemedText type="subtitle" style={styles.section}>
          Instructions
        </ThemedText>
        {recipe.instructions.length === 0 ? (
          <ThemedText style={{ color: mutedColor }}>No instructions from Spoonacular.</ThemedText>
        ) : (
          recipe.instructions.map((step, index) => (
            <ThemedText key={index} style={styles.step}>
              {index + 1}. {step}
            </ThemedText>
          ))
        )}

        <ThemedView style={[styles.hintBox, { borderColor }]}>
          <ThemedText style={[styles.hintText, { color: mutedColor }]}>
            🌍 This recipe comes from Spoonacular, not your kitchen catalog.
          </ThemedText>
          {recipe.sourceUrl && (
            <BouncyPressable onPress={() => Linking.openURL(recipe.sourceUrl!)} testID="external-source-link">
              <ThemedText style={styles.sourceLink}>View original recipe ↗</ThemedText>
            </BouncyPressable>
          )}
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
  image: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    marginBottom: 8,
  },
  meta: {
    fontSize: 14,
  },
  section: {
    marginTop: 16,
  },
  step: {
    marginTop: 4,
  },
  hintBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 12,
    marginTop: 24,
    gap: 8,
  },
  hintText: {
    fontSize: 13,
  },
  sourceLink: {
    color: Palette.rose,
    fontWeight: '600',
  },
});
