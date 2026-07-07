import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { RecipeForm } from '@/components/recipe-form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { emitMascot } from '@/lib/mascot';
import { getRecipe, Recipe, updateRecipe } from '@/lib/recipes';

export default function EditRecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe | undefined>();
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
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
  }, [id]);

  if (loaded && !recipe) {
    return (
      <ThemedView style={styles.center}>
        <Stack.Screen options={{ title: 'Edit recipe' }} />
        <ThemedText>This recipe no longer exists.</ThemedText>
      </ThemedView>
    );
  }

  if (!recipe) return <ThemedView style={styles.center} />;

  return (
    <>
      <Stack.Screen options={{ title: `Edit: ${recipe.title}` }} />
      <RecipeForm
        initialValue={{
          title: recipe.title,
          servings: recipe.servings,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
        }}
        submitLabel="Save changes"
        onSubmit={async (input) => {
          await updateRecipe(id, input);
          emitMascot('recipe-updated');
          router.back();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
