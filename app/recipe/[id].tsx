import { useCallback, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Palette } from '@/constants/theme';
import { emitMascot } from '@/lib/mascot';
import { deleteRecipe, getRecipe, Recipe } from '@/lib/recipes';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe | undefined>();
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getRecipe(id).then((data) => {
        if (active) {
          setRecipe(data);
          setLoaded(true);
        }
      });
      return () => {
        active = false;
      };
    }, [id])
  );

  const confirmDelete = () => {
    const doDelete = async () => {
      await deleteRecipe(id);
      emitMascot('recipe-deleted');
      router.back();
    };
    if (Platform.OS === 'web') {
      // Alert.alert no muestra botones en web; usamos confirm nativo.
      if (window.confirm('Delete this recipe? This cannot be undone.')) void doDelete();
    } else {
      Alert.alert('Delete recipe', 'Delete this recipe? This cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => void doDelete() },
      ]);
    }
  };

  if (loaded && !recipe) {
    return (
      <ThemedView style={styles.center}>
        <Stack.Screen options={{ title: 'Recipe' }} />
        <ThemedText testID="not-found">This recipe no longer exists.</ThemedText>
      </ThemedView>
    );
  }

  if (!recipe) return <ThemedView style={styles.center} />;

  return (
    <>
      <Stack.Screen options={{ title: recipe.title }} />
      <ScrollView contentContainerStyle={styles.container}>
        <ThemedText type="title">{recipe.title}</ThemedText>
        <ThemedText style={styles.meta}>
          {recipe.servings} serving{recipe.servings === 1 ? '' : 's'}
        </ThemedText>

        <ThemedText type="subtitle" style={styles.section}>
          Ingredients
        </ThemedText>
        {recipe.ingredients.map((ingredient, index) => (
          <ThemedText key={index}>
            • {ingredient.name}
            {ingredient.quantity ? ` — ${ingredient.quantity}` : ''}
          </ThemedText>
        ))}

        <ThemedText type="subtitle" style={styles.section}>
          Instructions
        </ThemedText>
        <ThemedText>{recipe.instructions}</ThemedText>

        <ThemedView style={styles.actions}>
          <Pressable
            style={styles.editButton}
            onPress={() => router.push({ pathname: '/recipe/edit/[id]', params: { id } })}
            testID="edit-recipe">
            <ThemedText style={styles.buttonText}>Edit</ThemedText>
          </Pressable>
          <Pressable style={styles.deleteButton} onPress={confirmDelete} testID="delete-recipe">
            <ThemedText style={styles.buttonText}>Delete</ThemedText>
          </Pressable>
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
    opacity: 0.7,
  },
  section: {
    marginTop: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  editButton: {
    flex: 1,
    backgroundColor: Palette.rose,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: Palette.danger,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
